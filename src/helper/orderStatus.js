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

export const formatOrderStatusLabel = (status) =>
  String(status || DEFAULT_ORDER_STATUS).replace(/-/g, " ");
