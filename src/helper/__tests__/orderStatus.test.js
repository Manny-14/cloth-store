import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORDER_STATUS,
  ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  formatOrderStatusLabel,
} from "../orderStatus";

describe("order status contract", () => {
  it("keeps default status as pending-shipment", () => {
    expect(DEFAULT_ORDER_STATUS).toBe(ORDER_STATUS.PENDING_SHIPMENT);
    expect(DEFAULT_ORDER_STATUS).toBe("pending-shipment");
  });

  it("contains all expected statuses", () => {
    expect(ORDER_STATUS_OPTIONS).toEqual([
      ORDER_STATUS.PENDING_SHIPMENT,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.DELIVERY_EXCEPTION,
      ORDER_STATUS.RETURNED,
      ORDER_STATUS.CANCELLED,
    ]);
  });

  it("formats hyphenated status for display", () => {
    expect(formatOrderStatusLabel("out-for-delivery")).toBe("out for delivery");
    expect(formatOrderStatusLabel("delivery-exception")).toBe("delivery exception");
  });
});
