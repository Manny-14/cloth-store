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

export const normalizeSizeLabel = (size) => {
  if (!size && size !== 0) return "";
  return String(size).trim().toUpperCase();
};

export const resolveSizeFieldKey = (size) => {
  const normalized = normalizeSizeLabel(size);
  return SIZE_FIELD_MAP[normalized] || null;
};
