import { describe, expect, it } from "vitest";
import { createHandleDispute, DISPUTE_STATUS } from "../lib/handleDispute.js";

/**
 * Minimal in-memory Firestore stand-in reused from finalizeSession tests.
 */
const createInMemoryDb = (seed = {}) => {
  const store = {
    orders: new Map(Object.entries(seed.orders || {})),
  };

  const makeDocRef = (name, id) => ({
    _name: name,
    id,
    update: async (fields) => {
      const current = store[name].get(id) || {};
      // Handle dot-notation field paths like "dispute.status"
      const merged = { ...current };
      for (const [key, value] of Object.entries(fields)) {
        if (key.includes(".")) {
          const parts = key.split(".");
          let target = merged;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]] || typeof target[parts[i]] !== "object") {
              target[parts[i]] = {};
            }
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = value;
        } else {
          merged[key] = value;
        }
      }
      store[name].set(id, merged);
    },
  });

  const collection = (name) => ({
    doc: (id) => makeDocRef(name, id),
    where: (field, _operator, value) => ({
      limit: () => ({
        get: async () => {
          const docs = [];
          for (const [id, data] of store[name].entries()) {
            if (data?.[field] === value) {
              docs.push({
                id,
                ref: makeDocRef(name, id),
                data: () => ({ ...data }),
              });
              break;
            }
          }
          return { empty: docs.length === 0, docs };
        },
      }),
    }),
  });

  return {
    collection,
    _store: store,
  };
};

const FieldValue = { serverTimestamp: () => "server-timestamp" };

const makeDispute = (overrides = {}) => ({
  id: "dp_test_123",
  payment_intent: "pi_test_abc",
  reason: "product_not_received",
  amount: 2999,
  currency: "usd",
  status: "needs_response",
  evidence_details: { due_by: 1720000000 },
  ...overrides,
});

describe("dispute handler", () => {
  it("onDisputeCreated attaches dispute info to matching order", async () => {
    const db = createInMemoryDb({
      orders: {
        order_1: {
          paymentIntentId: "pi_test_abc",
          status: "pending-shipment",
          total: 29.99,
        },
      },
    });

    const { onDisputeCreated } = createHandleDispute({ adminDb: db, FieldValue });

    const result = await onDisputeCreated(makeDispute());

    expect(result.matched).toBe(true);
    expect(result.orderId).toBe("order_1");

    const order = db._store.orders.get("order_1");
    expect(order.dispute).toBeTruthy();
    expect(order.dispute.status).toBe(DISPUTE_STATUS.OPEN);
    expect(order.dispute.reason).toBe("product_not_received");
    expect(order.dispute.stripeDisputeId).toBe("dp_test_123");
    expect(order.dispute.amount).toBe(2999);
  });

  it("onDisputeCreated returns matched=false when no order matches", async () => {
    const db = createInMemoryDb({ orders: {} });
    const { onDisputeCreated } = createHandleDispute({ adminDb: db, FieldValue });

    const result = await onDisputeCreated(makeDispute());
    expect(result.matched).toBe(false);
  });

  it("onDisputeUpdated transitions to under-review status", async () => {
    const db = createInMemoryDb({
      orders: {
        order_1: {
          paymentIntentId: "pi_test_abc",
          dispute: {
            status: DISPUTE_STATUS.OPEN,
            reason: "product_not_received",
            amount: 2999,
          },
        },
      },
    });

    const { onDisputeUpdated } = createHandleDispute({ adminDb: db, FieldValue });

    const result = await onDisputeUpdated(
      makeDispute({ status: "under_review" })
    );

    expect(result.matched).toBe(true);
    expect(result.status).toBe(DISPUTE_STATUS.UNDER_REVIEW);

    const order = db._store.orders.get("order_1");
    expect(order.dispute.status).toBe(DISPUTE_STATUS.UNDER_REVIEW);
  });

  it("onDisputeClosed marks dispute as won", async () => {
    const db = createInMemoryDb({
      orders: {
        order_1: {
          paymentIntentId: "pi_test_abc",
          dispute: {
            status: DISPUTE_STATUS.UNDER_REVIEW,
            reason: "product_not_received",
            amount: 2999,
          },
        },
      },
    });

    const { onDisputeClosed } = createHandleDispute({ adminDb: db, FieldValue });

    const result = await onDisputeClosed(makeDispute({ status: "won" }));

    expect(result.matched).toBe(true);
    expect(result.status).toBe(DISPUTE_STATUS.WON);

    const order = db._store.orders.get("order_1");
    expect(order.dispute.status).toBe(DISPUTE_STATUS.WON);
  });

  it("onDisputeClosed marks dispute as lost when not won", async () => {
    const db = createInMemoryDb({
      orders: {
        order_1: {
          paymentIntentId: "pi_test_abc",
          dispute: {
            status: DISPUTE_STATUS.UNDER_REVIEW,
            reason: "fraudulent",
            amount: 5000,
          },
        },
      },
    });

    const { onDisputeClosed } = createHandleDispute({ adminDb: db, FieldValue });

    const result = await onDisputeClosed(makeDispute({ status: "lost" }));

    expect(result.matched).toBe(true);
    expect(result.status).toBe(DISPUTE_STATUS.LOST);

    const order = db._store.orders.get("order_1");
    expect(order.dispute.status).toBe(DISPUTE_STATUS.LOST);
  });
});
