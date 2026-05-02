import { describe, expect, it, vi } from "vitest";
import { createFinalizePaidCheckoutSession } from "../lib/finalizeSession.js";

const createInMemoryDb = (seed = {}) => {
  const store = {
    orders: new Map(Object.entries(seed.orders || {})),
    products: new Map(Object.entries(seed.products || {})),
  };

  const makeDocSnapshot = (doc) => ({
    exists: Boolean(doc),
    data: () => (doc ? { ...doc } : undefined),
  });

  const makeDocRef = (name, id) => ({
    _name: name,
    id,
  });

  const collection = (name) => ({
    doc: (id) => makeDocRef(name, id),
    where: (field, _operator, value) => ({
      limit: () => ({
        get: async () => {
          const docs = [];
          for (const [id, data] of store[name].entries()) {
            if (data?.[field] === value) {
              docs.push({ id, data: () => ({ ...data }) });
              break;
            }
          }

          return {
            empty: docs.length === 0,
            docs,
          };
        },
      }),
    }),
  });

  const db = {
    collection,
    runTransaction: async (callback) => {
      const tx = {
        get: async (docRef) => {
          const found = store[docRef._name].get(docRef.id);
          return makeDocSnapshot(found);
        },
        update: (docRef, fields) => {
          const current = store[docRef._name].get(docRef.id) || {};
          store[docRef._name].set(docRef.id, {
            ...current,
            ...fields,
          });
        },
        set: (docRef, payload) => {
          store[docRef._name].set(docRef.id, { ...payload });
        },
      };

      await callback(tx);
    },
    _store: store,
  };

  return db;
};

const createStripeSession = () => ({
  id: "cs_test_1",
  payment_status: "paid",
  customer_email: "user@test.com",
  amount_total: 2999,
  metadata: {
    userId: "user_1",
    customerName: "Test User",
    deliveryFee: "7.99",
    checkoutMode: "cart",
    _lineItemMeta: JSON.stringify({
      0: {
        firebaseProductId: "product_1",
        size: "S",
      },
    }),
  },
  line_items: {
    data: [
      {
        quantity: 2,
        amount_subtotal: 2000,
        price: {
          nickname: "Basic Tee",
          metadata: {},
          product: {
            name: "Basic Tee",
            metadata: {},
            images: ["https://example.com/product.jpg"],
          },
        },
      },
    ],
  },
});

describe("finalize checkout session idempotency", () => {
  it("creates order and decrements inventory only once for repeated calls", async () => {
    const db = createInMemoryDb({
      products: {
        product_1: {
          smallQuantity: 10,
        },
      },
    });

    const stripeRetrieve = vi.fn().mockResolvedValue(createStripeSession());
    const stripe = {
      checkout: {
        sessions: {
          retrieve: stripeRetrieve,
        },
      },
    };

    const finalize = createFinalizePaidCheckoutSession({
      adminDb: db,
      stripe,
      FieldValue: {
        serverTimestamp: () => "server-timestamp",
      },
      toNumber: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      },
    });

    const first = await finalize("cs_test_1", "test");
    const second = await finalize("cs_test_1", "test");

    expect(first.alreadyFinalized).toBe(false);
    expect(second.alreadyFinalized).toBe(true);

    expect(stripeRetrieve).toHaveBeenCalledTimes(1);

    const order = db._store.orders.get("cs_test_1");
    expect(order).toBeTruthy();
    expect(order.stripeSessionId).toBe("cs_test_1");

    const product = db._store.products.get("product_1");
    expect(product.smallQuantity).toBe(8);
  });

  it("throws when payment is not confirmed", async () => {
    const db = createInMemoryDb();
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: "cs_unpaid",
            payment_status: "unpaid",
            metadata: {},
            line_items: { data: [] },
          }),
        },
      },
    };

    const finalize = createFinalizePaidCheckoutSession({
      adminDb: db,
      stripe,
      FieldValue: {
        serverTimestamp: () => "server-timestamp",
      },
      toNumber: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      },
    });

    await expect(finalize("cs_unpaid", "test")).rejects.toThrow("Payment not confirmed yet");
  });
});
