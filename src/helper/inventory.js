const SIZE_FIELD_MAP = {
  XS: "extraSmallQuantity",
  "EXTRA SMALL": "extraSmallQuantity",
  S: "smallQuantity",
  SM: "smallQuantity",
  SMALL: "smallQuantity",
  M: "mediumQuantity",
  MEDIUM: "mediumQuantity",
  L: "largeQuantity",
  LARGE: "largeQuantity",
  XL: "xlQuantity",
  "X-L": "xlQuantity",
  "EXTRA LARGE": "xlQuantity",
  XXL: "xxlQuantity",
  "2XL": "xxlQuantity",
  "XX-L": "xxlQuantity",
  "XX-LARGE": "xxlQuantity",
};

export const DEFAULT_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
export const NON_SIZED_KEY = "ONE_SIZE";

export const normalizeSizeLabel = (size) => {
  if (!size && size !== 0) return "";
  return String(size).trim().toUpperCase();
};

export const resolveSizeFieldKey = (size) => {
  const normalized = normalizeSizeLabel(size);
  return SIZE_FIELD_MAP[normalized] || null;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const hasSizeVariants = (product) => {
  if (!product) return true;
  if (typeof product.hasSizes === "boolean") return product.hasSizes;

  const explicitSizes = Array.isArray(product.sizes)
    ? product.sizes.filter(Boolean).map((size) => normalizeSizeLabel(size))
    : [];

  if (explicitSizes.length > 0) {
    return explicitSizes.some((size) => size && size !== NON_SIZED_KEY);
  }

  const knownSizeFields = [
    "extraSmallQuantity",
    "smallQuantity",
    "mediumQuantity",
    "largeQuantity",
    "xlQuantity",
    "xxlQuantity",
  ];

  return knownSizeFields.some((field) => toNumber(product[field]) > 0);
};

export const getSizedStockTotal = (product) => {
  if (!product) return 0;
  return (
    toNumber(product.extraSmallQuantity) +
    toNumber(product.smallQuantity) +
    toNumber(product.mediumQuantity) +
    toNumber(product.largeQuantity) +
    toNumber(product.xlQuantity) +
    toNumber(product.xxlQuantity)
  );
};

export const getTotalStockQuantity = (product) => {
  if (!product) return 0;
  if (hasSizeVariants(product)) {
    return getSizedStockTotal(product);
  }

  return toNumber(
    product.stockQuantity ?? product.totalQuantity ?? product.quantity ?? 0
  );
};
