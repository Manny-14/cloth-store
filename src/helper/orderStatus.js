export const ORDER_STATUS = {
  PENDING_SHIPMENT: "pending-shipment",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  DELIVERY_EXCEPTION: "delivery-exception",
  RETURNED: "returned",
  CANCELLED: "cancelled",
};

export const DISPUTE_STATUS = {
  OPEN: "dispute-open",
  UNDER_REVIEW: "dispute-under-review",
  WON: "dispute-won",
  LOST: "dispute-lost",
};

export const DEFAULT_ORDER_STATUS = ORDER_STATUS.PENDING_SHIPMENT;

export const ORDER_STATUS_OPTIONS = [
  ORDER_STATUS.PENDING_SHIPMENT,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.DELIVERY_EXCEPTION,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.CANCELLED,
];

export const DISPUTE_STATUS_OPTIONS = [
  DISPUTE_STATUS.OPEN,
  DISPUTE_STATUS.UNDER_REVIEW,
  DISPUTE_STATUS.WON,
  DISPUTE_STATUS.LOST,
];

export const formatOrderStatusLabel = (status) =>
  String(status || DEFAULT_ORDER_STATUS).replace(/-/g, " ");

export const isDisputeActive = (disputeStatus) =>
  disputeStatus === DISPUTE_STATUS.OPEN || disputeStatus === DISPUTE_STATUS.UNDER_REVIEW;
