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
    const { lineItems = [], successUrl, cancelUrl, customerEmail, metadata = {} } = req.body || {};

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems is required and must be a non-empty array" });
    }

    const sanitizedItems = lineItems.map((item) => {
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

      return {
        price,
        quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: sanitizedItems,
      allow_promotion_codes: true,
      customer_email: customerEmail,
      success_url: successUrl || `${CLIENT_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${CLIENT_ORIGIN}/checkout/cancel`,
      metadata,
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return res.status(400).json({ error: error.message || "Unable to create checkout session" });
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
