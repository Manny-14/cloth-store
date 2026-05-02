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
- `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` (optional, required for protected admin order updates)
	- Example: `../service-account.json`

3) Run the server

```bash
npm run dev
```

### Tailscale phone testing (no public deploy)

If your phone and laptop are on the same Tailscale tailnet, you can test directly from phone.

1. Get your laptop's Tailscale IPv4 from the Tailscale app/UI.
2. In `server/.env`, set `CLIENT_ORIGIN` to include both local and Tailscale frontend origins:

```env
CLIENT_ORIGIN=http://localhost:5173,http://<TAILSCALE_IP>:5173
```

3. In frontend `.env`, set the API server URL:

```env
VITE_STRIPE_SERVER_URL=http://<TAILSCALE_IP>:4242
```

4. Run frontend with host binding:

```bash
npm run dev:host
```

5. Open on phone:

```text
http://<TAILSCALE_IP>:5173/Clothify-React/
```

6. Backend health check from phone:

```text
http://<TAILSCALE_IP>:4242/health
```

4) Forward webhooks in test mode (optional but recommended)

```bash
stripe listen --forward-to http://localhost:4242/webhook
stripe trigger checkout.session.completed
```

### Client usage

- Call `POST /create-checkout-session` with `{ lineItems: [{ priceId, quantity }], metadata?, customerEmail?, successUrl?, cancelUrl? }`.
- Redirect to the returned `url` (or use Stripe.js with `sessionId`).
- The webhook at `/webhook` verifies signatures and finalizes paid checkout sessions.
- The server supports `POST /checkout/finalize-session` to finalize paid sessions server-side (idempotent by `stripeSessionId`).
- The webhook `checkout.session.completed` also triggers the same finalization path.

### Notes

- Keep secret keys out of the frontend. Only the publishable key belongs client-side.
- Restrict `ALLOWED_PRICE_IDS` so only your intended prices can be used.
- For production, set strong CORS and host on a server you control; avoid exposing this server publicly with test keys.
- Admin delivery updates are now protected at `POST /admin/orders/:orderId/delivery` and require:
	- Firebase ID token in `Authorization: Bearer <token>`
	- user role `ADMIN` in Firestore `users/{uid}`
	- server-side Firebase Admin SDK configuration

### Switching from Stripe test mode to live mode

This project is already structured so the switch is mostly configuration.

Go-live checklist:

1. Replace test secret with live secret in `server/.env`
	- `STRIPE_SECRET_KEY=sk_live_...`
2. Create a live webhook endpoint in Stripe Dashboard and set:
	- `STRIPE_WEBHOOK_SECRET=whsec_...` (live endpoint secret)
3. Use live product/price IDs in Firestore products (`stripePriceId`)
	- test IDs (`price_...`) are not reusable in live mode
4. Set production frontend origin:
	- `CLIENT_ORIGIN=https://your-domain.com`
5. Keep `ALLOWED_PRICE_IDS` populated with your live price IDs
6. Confirm success/cancel URLs resolve correctly for your deployed app
7. Run one real low-value payment and confirm:
	- Checkout completes
	- `/checkout/session` returns expected metadata
	- order is created once (idempotency check)

Estimated effort: usually under 1 hour if products/prices are already created in live Stripe.

### Frontend wiring (Stripe)

- Set `VITE_STRIPE_SERVER_URL` in `.env.local` (e.g., `http://localhost:4242`).
- Checkout flow (in `PlaceOrder.jsx`) uses `stripePriceId` on each product; ensure products have been synced first.

## Delivery pricing defaults (temporary)

Current shipping logic is centralized in `src/helper/shipping.js`.

Rules:

- `standard_shipping`: `$7.99`
- free standard shipping when subtotal `>= $75`
- weight surcharge: `+$2` if estimated cart weight > 4kg, `+$4` if > 8kg

Weight assumptions for now (used if product has no explicit `weightKg`):

- towel items: `0.8kg`
- hoodie/sweater/outerwear: `0.7kg`
- default clothing: `0.35kg`

Implementation notes:

- Checkout computes a client-side estimate for UX only.
- Server recomputes shipping from trusted Stripe price/product data and appends a shipping line item in Stripe Checkout.
- Order record stores the fee in `deliveryFee`, and delivery metadata/status is created on payment success.

## Product sizing policy

Products are split into two inventory models:

- **Sized products**: use this for apparel with selectable fit sizes, such as shirts, hoodies, sweaters, or other items that naturally map to `S`, `M`, `L`, and `XL`. Stock is tracked per size, and customers must choose a size before adding the item to cart.
- **Non-sized products**: use this for one-size or measurement-specific items, such as towels, towel sets, jewelry, accessories, and similar goods. Stock is tracked as one total quantity.

For towels and other measurement-specific products, keep them as non-sized products and include the specific measurement in the product title or description, for example `Embroidered Towel Set 27x54`. This avoids making dimensions look like apparel size choices while still showing customers the exact product size before purchase.

### Local-only utility scripts

The `server/scripts/` directory (git-ignored) contains admin utilities:

- **`syncStripePrices.js`** — backfill Stripe Product/Price IDs into Firestore products.
- **`deleteAllOrders.js`** — wipe all orders from the Firestore `orders` collection.

Both require `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` and `STRIPE_SECRET_KEY` in `server/.env`. See each script's header for details.
