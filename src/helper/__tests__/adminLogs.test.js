import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => {
  return {
    addDoc: vi.fn(),
    collection: vi.fn((db, name) => ({ db, name })),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    getDocs: vi.fn(),
    query: vi.fn((...args) => args),
    orderBy: vi.fn((field, direction) => ({ field, direction })),
    limit: vi.fn((max) => ({ max })),
  };
});

vi.mock("../../../firebase/firebase", () => ({
  db: { name: "mock-db" },
}));

import { addDoc, getDocs } from "firebase/firestore";
import { createAdminLog } from "../../../firebase/logs/createAdminLog";
import { getAdminLogs } from "../../../firebase/logs/getAdminLogs";

describe("admin log helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips log writes when event is missing", async () => {
    await createAdminLog({
      event: "",
      severity: "warning",
      source: "client",
      message: "",
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it("writes normalized admin logs", async () => {
    addDoc.mockResolvedValue({ id: "log-1" });

    await createAdminLog({
      event: "checkout.session_create_failed",
      severity: "critical",
      source: "client",
      message: "Stripe checkout failed",
      context: {
        productId: "prod_1",
        userId: "",
        count: 0,
      },
    });

    expect(addDoc).toHaveBeenCalledTimes(1);

    const [, payload] = addDoc.mock.calls[0];
    expect(payload.event).toBe("checkout.session_create_failed");
    expect(payload.severity).toBe("critical");
    expect(payload.source).toBe("client");
    expect(payload.message).toBe("Stripe checkout failed");
    expect(payload.context).toEqual({ productId: "prod_1", count: 0 });
    expect(payload.createdAt).toBe("server-timestamp");
  });

  it("returns mapped admin logs", async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: "log-1", data: () => ({ event: "evt-1" }) },
        { id: "log-2", data: () => ({ event: "evt-2" }) },
      ],
    });

    const logs = await getAdminLogs({ max: 50 });

    expect(logs).toEqual([
      { id: "log-1", event: "evt-1" },
      { id: "log-2", event: "evt-2" },
    ]);
  });
});
