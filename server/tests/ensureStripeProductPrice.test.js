import { describe, expect, it, vi } from "vitest";
import { createEnsureStripeProductPriceHandler } from "../lib/ensureStripeProductPrice.js";

const createRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const createMockDb = (products = {}) => ({
  collection: () => ({
    doc: (id) => ({
      id,
      async get() {
        const data = products[id];
        return {
          exists: Boolean(data),
          data: () => data,
        };
      },
      async set(patch) {
        products[id] = {
          ...(products[id] || {}),
          ...patch,
        };
      },
    }),
  }),
  _products: products,
});

describe("ensureStripeProductPrice handler", () => {
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  it("returns 404 when productId is provided but product does not exist", async () => {
    const adminDb = createMockDb({});
    const stripe = {
      products: { retrieve: vi.fn(), create: vi.fn(), update: vi.fn() },
      prices: { retrieve: vi.fn(), create: vi.fn() },
    };

    const handler = createEnsureStripeProductPriceHandler({
      adminDb,
      stripe,
      toNumber,
      stripeCurrency: "usd",
    });

    const req = {
      body: {
        productId: "missing-product",
      },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });

  it("returns 400 when price resolves to zero", async () => {
    const adminDb = createMockDb({
      p1: {
        productName: "Dress",
        price: 0,
      },
    });

    const stripe = {
      products: { retrieve: vi.fn(), create: vi.fn(), update: vi.fn() },
      prices: { retrieve: vi.fn(), create: vi.fn() },
    };

    const handler = createEnsureStripeProductPriceHandler({
      adminDb,
      stripe,
      toNumber,
      stripeCurrency: "usd",
    });

    const req = {
      body: {
        productId: "p1",
      },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("price");
  });

  it("creates Stripe product and price then patches Firestore", async () => {
    const adminDb = createMockDb({
      p2: {
        productName: "Summer Tee",
        description: "Cotton",
        price: 29.99,
        images: ["https://img.test/tee.jpg"],
      },
    });

    const stripe = {
      products: {
        retrieve: vi.fn().mockRejectedValue(new Error("missing")),
        create: vi.fn().mockResolvedValue({
          id: "prod_new_1",
          name: "Summer Tee",
          description: "Cotton",
          images: ["https://img.test/tee.jpg"],
          metadata: {},
        }),
        update: vi.fn(),
      },
      prices: {
        retrieve: vi.fn().mockRejectedValue(new Error("missing")),
        create: vi.fn().mockResolvedValue({ id: "price_new_1" }),
      },
    };

    const handler = createEnsureStripeProductPriceHandler({
      adminDb,
      stripe,
      toNumber,
      stripeCurrency: "usd",
    });

    const req = {
      body: {
        productId: "p2",
      },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.stripeProductId).toBe("prod_new_1");
    expect(res.body.stripePriceId).toBe("price_new_1");
    expect(stripe.products.create).toHaveBeenCalledTimes(1);
    expect(stripe.prices.create).toHaveBeenCalledTimes(1);

    expect(adminDb._products.p2.stripeProductId).toBe("prod_new_1");
    expect(adminDb._products.p2.stripePriceId).toBe("price_new_1");
    expect(adminDb._products.p2.stripeUnitAmount).toBe(2999);
  });
});
