# Cloth Store

Frontend: React + Vite + Firebase (Firestore/Auth)

## Stripe checkout server (new)

Located in `server/` — a minimal Express server that creates Stripe Checkout Sessions and verifies webhooks. Use Stripe **test keys only** unless you intend to go live.

### Setup

1) Install dependencies

```bash
cd server
npm install
```

2) Create your env file

```bash
cp .env.example .env
```

Fill in:

- `STRIPE_SECRET_KEY` (test key)
- `STRIPE_WEBHOOK_SECRET` (from `stripe listen` or Dashboard)
- `CLIENT_ORIGIN` (e.g., http://localhost:5173)
- `ALLOWED_PRICE_IDS` (comma-separated Stripe Price IDs you want to allow)

3) Run the server

```bash
npm run dev
```

4) Forward webhooks in test mode (optional but recommended)

```bash
stripe listen --forward-to http://localhost:4242/webhook
stripe trigger checkout.session.completed
```

### Client usage

- Call `POST /create-checkout-session` with `{ lineItems: [{ priceId, quantity }], metadata?, customerEmail?, successUrl?, cancelUrl? }`.
- Redirect to the returned `url` (or use Stripe.js with `sessionId`).
- The webhook at `/webhook` verifies signatures and is the place to persist orders / adjust inventory (marked TODO in `server/index.js`).

### Notes

- Keep secret keys out of the frontend. Only the publishable key belongs client-side.
- Restrict `ALLOWED_PRICE_IDS` so only your intended prices can be used.
- For production, set strong CORS and host on a server you control; avoid exposing this server publicly with test keys.

### Frontend wiring (Stripe)

- Set `VITE_STRIPE_SERVER_URL` in `.env.local` (e.g., `http://localhost:4242`).
- Checkout flow (in `PlaceOrder.jsx`) uses `stripePriceId` on each product; ensure products have been synced first.

## Delivery pricing defaults (temporary)

Current shipping logic is centralized in `src/helper/shipping.js`.

Rules:

- `standard_shipping`: `$7.99`
- `doorstep_delivery`: `$12.99`
- free standard shipping when subtotal `>= $150`
- doorstep discounted to `$8.99` when subtotal `>= $150`
- weight surcharge: `+$2` if estimated cart weight > 4kg, `+$4` if > 8kg

Weight assumptions for now (used if product has no explicit `weightKg`):

- towel items: `0.8kg`
- hoodie/sweater/outerwear: `0.7kg`
- default clothing: `0.35kg`

Implementation notes:

- Checkout computes a client-side estimate for UX only.
- Server recomputes shipping from trusted Stripe price/product data and appends a shipping line item in Stripe Checkout.
- Order record stores the fee in `deliveryFee`, and delivery metadata/status is created on payment success.

### Local-only utility scripts

The `server/scripts/` directory (git-ignored) contains admin utilities:

- **`syncStripePrices.js`** — backfill Stripe Product/Price IDs into Firestore products.
- **`deleteAllOrders.js`** — wipe all orders from the Firestore `orders` collection.

Both require `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` and `STRIPE_SECRET_KEY` in `server/.env`. See each script's header for details.