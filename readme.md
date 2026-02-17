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