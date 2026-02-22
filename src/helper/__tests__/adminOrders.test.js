import { afterEach, describe, expect, it, vi } from "vitest";
import { updateOrderDeliveryByAdmin } from "../adminOrders";

describe("admin order updates", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends authenticated admin request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock;

    const currentUser = {
      getIdToken: vi.fn().mockResolvedValue("token-123"),
    };

    await updateOrderDeliveryByAdmin({
      orderId: "order_1",
      status: "shipped",
      carrier: "UPS",
      trackingNumber: "1Z000",
      trackingUrl: "https://example.com/track",
      currentUser,
    });

    expect(currentUser.getIdToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, config] = fetchMock.mock.calls[0];
    expect(url).toContain("/admin/orders/order_1/delivery");
    expect(config.headers.Authorization).toBe("Bearer token-123");
  });

  it("throws a readable error when server update fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Admin access required" }),
    });

    const currentUser = {
      getIdToken: vi.fn().mockResolvedValue("token-123"),
    };

    await expect(
      updateOrderDeliveryByAdmin({
        orderId: "order_1",
        status: "shipped",
        currentUser,
      })
    ).rejects.toThrow("Admin access required");
  });
});
