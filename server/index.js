import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_ORIGIN = "http://localhost:5173",
  ALLOWED_PRICE_IDS = "",
  STRIPE_CURRENCY = "usd",
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

const app = express();
const port = process.env.PORT || 4242;

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

app.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      lineItems = [],
      successUrl,
      cancelUrl,
      customerEmail,
      metadata = {},
      shippingFee = 0,
    } = req.body || {};

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems is required and must be a non-empty array" });
    }

    const sanitizedItems = [];
    const lineItemMeta = {}; // keyed by index → { size, firebaseProductId }

    lineItems.forEach((item, idx) => {
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

      sanitizedItems.push({ price, quantity });

      // Preserve per-line-item metadata (size, productId) in session metadata
      if (item?.metadata) {
        lineItemMeta[idx] = {
          size: item.metadata.size || "",
          firebaseProductId: item.metadata.firebaseProductId || "",
        };
      }
    });

    const normalizedShippingFee = Number(shippingFee);
    if (Number.isFinite(normalizedShippingFee) && normalizedShippingFee > 0) {
      sanitizedItems.push({
        quantity: 1,
        price_data: {
          currency: String(STRIPE_CURRENCY || "usd").toLowerCase(),
          unit_amount: Math.round(normalizedShippingFee * 100),
          product_data: {
            name: "Shipping",
            description: "Delivery charge",
          },
        },
      });
    }

    const normalizedMetadata = Object.entries(metadata || {}).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = String(value);
      return acc;
    }, {});

    // Stripe session metadata values must be strings (max 500 chars each).
    // Store the per-line-item map as a JSON string.
    const sessionMetadata = {
      ...normalizedMetadata,
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

app.post("/checkout/session", async (req, res) => {
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

// Webhook needs raw body for signature verification
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
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
        // TODO: persist order, tie to user, decrement inventory, and mark payment status.
        console.log("Checkout completed:", session.id);
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
