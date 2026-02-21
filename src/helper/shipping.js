const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const detectItemWeightKg = (item) => {
  const explicitWeight = toNumber(item?.weightKg ?? item?.weight);
  if (explicitWeight > 0) return explicitWeight;

  const name = String(item?.productName || item?.name || "").toLowerCase();
  const category = String(item?.category || item?.subCategory || item?.type || "").toLowerCase();

  // Temporary assumptions for this store profile: clothes + towels
  if (name.includes("towel") || category.includes("towel")) return 0.8;
  if (name.includes("hoodie") || name.includes("sweater") || category.includes("outerwear")) return 0.7;

  return 0.35; // default light clothing item
};

export const estimateCartWeightKg = (lineItems = []) => {
  return lineItems.reduce((sum, item) => {
    const quantity = Math.max(0, toNumber(item?.quantity));
    return sum + detectItemWeightKg(item) * quantity;
  }, 0);
};

export const calculateShippingFee = ({
  subtotal = 0,
  deliveryMethod = "standard_shipping",
  estimatedWeightKg = 0,
}) => {
  const normalizedSubtotal = toNumber(subtotal);
  const normalizedWeight = toNumber(estimatedWeightKg);

  // Temporary baseline rules (Nashville seller)
  const FREE_STANDARD_THRESHOLD = 150;
  const STANDARD_BASE = 7.99;
  const DOORSTEP_BASE = 12.99;

  const weightSurcharge =
    normalizedWeight > 8 ? 4 : normalizedWeight > 4 ? 2 : 0;

  if (deliveryMethod === "doorstep_delivery") {
    const discountedDoorstep = normalizedSubtotal >= FREE_STANDARD_THRESHOLD ? 8.99 : DOORSTEP_BASE;
    return Number((discountedDoorstep + weightSurcharge).toFixed(2));
  }

  if (normalizedSubtotal >= FREE_STANDARD_THRESHOLD) {
    return Number((0 + weightSurcharge).toFixed(2));
  }

  return Number((STANDARD_BASE + weightSurcharge).toFixed(2));
};
