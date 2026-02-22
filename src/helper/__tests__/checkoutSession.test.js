import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCheckoutSession } from "../checkoutSession";

describe("checkout session helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed session payload on success", async () => {
    const payload = { id: "cs_test_123", payment_status: "paid" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchCheckoutSession("cs_test_123");

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws server-provided error message for failed requests", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "sessionId is required" }),
    });

    await expect(fetchCheckoutSession("")).rejects.toThrow("sessionId is required");
  });

  it("falls back to generic status message when error payload is unavailable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    await expect(fetchCheckoutSession("cs_test_123")).rejects.toThrow(
      "Failed to load session (500)"
    );
  });
});
