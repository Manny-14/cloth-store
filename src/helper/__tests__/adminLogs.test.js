import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn((db, name) => ({ db, name })),
    getDocs: vi.fn(),
    query: vi.fn((...args) => args),
    orderBy: vi.fn((field, direction) => ({ field, direction })),
    limit: vi.fn((max) => ({ max })),
  };
});

vi.mock("../../../firebase/firebase", () => ({
  db: { name: "mock-db" },
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue("token_123"),
    },
  },
}));

import { getDocs } from "firebase/firestore";
import { createAdminLog } from "../../../firebase/logs/createAdminLog";
import { getAdminLogs } from "../../../firebase/logs/getAdminLogs";

describe("admin log helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips log writes when event is missing", async () => {
    globalThis.fetch = vi.fn();

    await createAdminLog({
      event: "",
      severity: "warning",
      source: "client",
      message: "",
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("sends normalized diagnostics to the backend", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

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

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, request] = globalThis.fetch.mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(url).toMatch(/\/client-diagnostics$/);
    expect(request.headers.Authorization).toBe("Bearer token_123");
    expect(payload.event).toBe("checkout.session_create_failed");
    expect(payload.severity).toBe("critical");
    expect(payload.source).toBe("client");
    expect(payload.message).toBe("Stripe checkout failed");
    expect(payload.context).toEqual({ productId: "prod_1", count: 0 });
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
