import { afterEach, describe, expect, it, vi } from "vitest";
import { createStripeCheckoutSession } from "../stripe";

describe("stripe checkout helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns checkout URL payload on success", async () => {
    const responsePayload = {
      url: "https://checkout.stripe.com/pay/cs_test_123",
      sessionId: "cs_test_123",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
    });

    const result = await createStripeCheckoutSession({
      lineItems: [{ priceId: "price_123", quantity: 1 }],
    });

    expect(result).toEqual(responsePayload);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws API error message when server responds with failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "lineItems is required" }),
    });

    await expect(createStripeCheckoutSession({ lineItems: [] })).rejects.toThrow(
      "lineItems is required"
    );
  });

  it("throws readable network error when fetch itself fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(
      createStripeCheckoutSession({
        lineItems: [{ priceId: "price_123", quantity: 1 }],
      })
    ).rejects.toThrow("Failed to fetch");
  });
});
