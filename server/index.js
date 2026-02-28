import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createFinalizePaidCheckoutSession } from "./lib/finalizeSession.js";
import { createHandleDispute } from "./lib/handleDispute.js";

dotenv.config();

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_ORIGIN = "http://localhost:5173",
  ALLOWED_PRICE_IDS = "",
  STRIPE_CURRENCY = "usd",
  FIREBASE_SERVICE_ACCOUNT_KEY_PATH = "",
  FIREBASE_SERVICE_ACCOUNT_JSON = "",
} = process.env;

if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY in environment");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const allowedPriceIds = ALLOWED_PRICE_IDS
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const detectItemWeightKg = (item = {}) => {
  const explicitWeight = toNumber(item.weightKg ?? item.weight);
  if (explicitWeight > 0) return explicitWeight;

  const name = String(item.name || "").toLowerCase();
  const description = String(item.description || "").toLowerCase();
  const haystack = `${name} ${description}`;

  if (haystack.includes("towel")) return 0.8;
  if (haystack.includes("hoodie") || haystack.includes("sweater") || haystack.includes("outerwear")) {
    return 0.7;
  }

  return 0.35;
};

const calculateShippingFee = ({
  subtotal = 0,
  deliveryMethod = "standard_shipping",
  estimatedWeightKg = 0,
}) => {
  const FREE_STANDARD_THRESHOLD = 150;
  const STANDARD_BASE = 7.99;
  const DOORSTEP_BASE = 12.99;

  const normalizedSubtotal = toNumber(subtotal);
  const normalizedWeight = toNumber(estimatedWeightKg);

  const weightSurcharge = normalizedWeight > 8 ? 4 : normalizedWeight > 4 ? 2 : 0;

  if (deliveryMethod === "doorstep_delivery") {
    const discountedDoorstep = normalizedSubtotal >= FREE_STANDARD_THRESHOLD ? 8.99 : DOORSTEP_BASE;
    return Number((discountedDoorstep + weightSurcharge).toFixed(2));
  }

  if (normalizedSubtotal >= FREE_STANDARD_THRESHOLD) {
    return Number((0 + weightSurcharge).toFixed(2));
  }

  return Number((STANDARD_BASE + weightSurcharge).toFixed(2));
};

const app = express();
const port = process.env.PORT || 4242;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORDER_STATUS_OPTIONS = new Set([
  "pending-shipment",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
  "delivery-exception",
  "returned",
  "cancelled",
]);

const normalizeServiceAccountPath = (serviceAccountPath) => {
  if (!serviceAccountPath) return "";
  return path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, serviceAccountPath);
};

const resolveServiceAccountConfig = () => {
  if (FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (FIREBASE_SERVICE_ACCOUNT_KEY_PATH?.trim()) {
    const normalizedPath = normalizeServiceAccountPath(FIREBASE_SERVICE_ACCOUNT_KEY_PATH.trim());
    const raw = fs.readFileSync(normalizedPath, "utf8");
    return JSON.parse(raw);
  }

  return null;
};

let adminAuth = null;
let adminDb = null;

try {
  const serviceAccount = resolveServiceAccountConfig();
  if (serviceAccount) {
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    adminAuth = getAuth();
    adminDb = getFirestore();
  } else {
    console.warn(
      "Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable admin-protected routes."
    );
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK", error);
}

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many checkout requests. Please wait a moment and try again.",
  },
});

const sessionLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many session lookups. Please try again shortly.",
  },
});

const finalizeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many finalize requests. Please try again shortly.",
  },
});

const adminUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many admin update requests. Please try again shortly.",
  },
});

const requireAdminAuth = async (req, res, next) => {
  if (!adminAuth || !adminDb) {
    return res.status(503).json({
      error: "Admin API is not configured on server.",
    });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization bearer token" });
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return res.status(401).json({ error: "Invalid bearer token" });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const role = String(userDoc.data()?.role || "").toUpperCase();

    if (role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.adminUser = {
      uid: decoded.uid,
      email: decoded.email || "",
      role,
    };

    return next();
  } catch (error) {
    console.error("Admin auth verification failed", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const finalizePaidCheckoutSession = createFinalizePaidCheckoutSession({
  adminDb,
  stripe,
  FieldValue,
  toNumber,
});

const { onDisputeCreated, onDisputeUpdated, onDisputeClosed } = createHandleDispute({
  adminDb,
  FieldValue,
});

// CORS for the frontend
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// JSON parser for non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/create-checkout-session", checkoutLimiter, async (req, res) => {
  try {
    const {
      lineItems = [],
      successUrl,
      cancelUrl,
      customerEmail,
      metadata = {},
    } = req.body || {};

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems is required and must be a non-empty array" });
    }

    const sanitizedItems = [];
    const lineItemMeta = {}; // keyed by index → { size, firebaseProductId }
    let subtotal = 0;
    let estimatedWeightKg = 0;

    for (let idx = 0; idx < lineItems.length; idx += 1) {
      const item = lineItems[idx];
      const price = item?.priceId || item?.price;
      const quantity = Number(item?.quantity || 1);

      if (!price) {
        throw new Error("Each line item must include priceId or price");
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a positive number");
      }

      if (allowedPriceIds.length && !allowedPriceIds.includes(price)) {
        throw new Error("Price ID is not allowed");
      }

      const stripePrice = await stripe.prices.retrieve(price, {
        expand: ["product"],
      });

      const unitAmount = toNumber(stripePrice?.unit_amount) / 100;
      subtotal += unitAmount * quantity;

      const stripeProduct = stripePrice?.product;
      const productName = typeof stripeProduct === "object" ? stripeProduct?.name : "";
      const productDescription = typeof stripeProduct === "object" ? stripeProduct?.description : "";
      estimatedWeightKg += detectItemWeightKg({
        name: productName,
        description: productDescription,
      }) * quantity;

      sanitizedItems.push({ price, quantity });

      // Preserve per-line-item metadata (size, productId) in session metadata
      if (item?.metadata) {
        lineItemMeta[idx] = {
          size: item.metadata.size || "",
          firebaseProductId: item.metadata.firebaseProductId || "",
        };
      }
    }

    const normalizedMetadata = Object.entries(metadata || {}).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = String(value);
      return acc;
    }, {});

    const deliveryMethod = normalizedMetadata.deliveryMethod || "standard_shipping";
    const computedShippingFee = calculateShippingFee({
      subtotal,
      deliveryMethod,
      estimatedWeightKg,
    });

    if (computedShippingFee > 0) {
      sanitizedItems.push({
        quantity: 1,
        price_data: {
          currency: String(STRIPE_CURRENCY || "usd").toLowerCase(),
          unit_amount: Math.round(computedShippingFee * 100),
          product_data: {
            name: "Shipping",
            description: "Delivery charge",
          },
        },
      });
    }

    // Stripe session metadata values must be strings (max 500 chars each).
    // Store the per-line-item map as a JSON string.
    const sessionMetadata = {
      ...normalizedMetadata,
      deliveryFee: computedShippingFee.toFixed(2),
      _lineItemMeta: JSON.stringify(lineItemMeta),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: sanitizedItems,
      allow_promotion_codes: true,
      customer_email: customerEmail,
      success_url: successUrl || `${CLIENT_ORIGIN}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${CLIENT_ORIGIN}/#/checkout/cancel`,
      metadata: sessionMetadata,
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return res.status(400).json({ error: error.message || "Unable to create checkout session" });
  }
});

app.post("/checkout/session", sessionLookupLimiter, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    // Parse the per-line-item metadata we stored during session creation
    let lineItemMeta = {};
    try {
      lineItemMeta = JSON.parse(session.metadata?._lineItemMeta || "{}");
    } catch {
      // ignore parse errors
    }

    const lineItems = (session.line_items?.data || []).map((item, idx) => {
      const price = item.price;
      const product = price?.product;
      const meta = lineItemMeta[String(idx)] || {};
      return {
        priceId: price?.id,
        quantity: item.quantity,
        amountSubtotal: item.amount_subtotal,
        amountTotal: item.amount_total,
        currency: item.currency,
        firebaseProductId: meta.firebaseProductId || price?.metadata?.firebaseProductId || product?.metadata?.firebaseProductId,
        size: meta.size || "",
        name: product?.name || price?.nickname,
      };
    });

    // Strip internal metadata key before returning to client
    const publicMetadata = { ...(session.metadata || {}) };
    delete publicMetadata._lineItemMeta;

    return res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: publicMetadata,
      lineItems,
    });
  } catch (error) {
    console.error("Error retrieving session", error);
    return res.status(400).json({ error: error.message || "Unable to retrieve session" });
  }
});

app.post("/checkout/finalize-session", finalizeLimiter, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const result = await finalizePaidCheckoutSession(sessionId, "success-page");
    return res.json(result);
  } catch (error) {
    console.error("Error finalizing checkout session", error);
    const message = error?.message || "Unable to finalize checkout session";
    if (message.includes("not configured")) {
      return res.status(503).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

app.post("/admin/orders/:orderId/delivery", adminUpdateLimiter, requireAdminAuth, async (req, res) => {
  try {
    const { orderId } = req.params || {};
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const {
      status,
      carrier = "",
      trackingNumber = "",
      trackingUrl = "",
      note = "Updated by admin",
    } = req.body || {};

    if (!status || !ORDER_STATUS_OPTIONS.has(status)) {
      return res.status(400).json({
        error: "A valid delivery status is required",
      });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const existingOrder = orderDoc.data() || {};
    const previousStatus = existingOrder.delivery?.status || existingOrder.status || "pending-shipment";
    const nextHistory = Array.isArray(existingOrder.delivery?.statusHistory)
      ? [...existingOrder.delivery.statusHistory]
      : [];

    if (status !== previousStatus) {
      nextHistory.push({
        status,
        at: new Date().toISOString(),
        note: String(note || "Updated by admin"),
        updatedBy: req.adminUser?.uid || "",
      });
    }

    await orderRef.update({
      status,
      delivery: {
        ...(existingOrder.delivery || {}),
        status,
        carrier: String(carrier || ""),
        trackingNumber: String(trackingNumber || ""),
        trackingUrl: String(trackingUrl || ""),
        statusHistory: nextHistory,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to update order delivery", error);
    return res.status(500).json({ error: "Unable to update order delivery" });
  }
});

// Webhook needs raw body for signature verification
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send("Webhook signature missing or secret not configured");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        try {
          const result = await finalizePaidCheckoutSession(session.id, "webhook");
          console.log("Checkout completed and finalized:", session.id, result);
        } catch (error) {
          console.error("Webhook finalization failed", error);
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object;
        try {
          const result = await onDisputeCreated(dispute);
          console.log("Dispute created:", dispute.id, result);
        } catch (error) {
          console.error("Dispute created handler failed", error);
        }
        break;
      }
      case "charge.dispute.updated": {
        const dispute = event.data.object;
        try {
          const result = await onDisputeUpdated(dispute);
          console.log("Dispute updated:", dispute.id, result);
        } catch (error) {
          console.error("Dispute updated handler failed", error);
        }
        break;
      }
      case "charge.dispute.closed": {
        const dispute = event.data.object;
        try {
          const result = await onDisputeClosed(dispute);
          console.log("Dispute closed:", dispute.id, result);
        } catch (error) {
          console.error("Dispute closed handler failed", error);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});
