import { describe, expect, it } from "vitest";
import {
  NON_SIZED_KEY,
  getTotalStockQuantity,
  hasSizeVariants,
  normalizeSizeLabel,
  resolveSizeFieldKey,
} from "../inventory";

describe("inventory size mapping", () => {
  it("normalizes user-provided size labels", () => {
    expect(normalizeSizeLabel(" xl ")).toBe("XL");
    expect(normalizeSizeLabel("extra small")).toBe("EXTRA SMALL");
  });

  it("maps known aliases to Firestore quantity fields", () => {
    expect(resolveSizeFieldKey("XS")).toBe("extraSmallQuantity");
    expect(resolveSizeFieldKey("sm")).toBe("smallQuantity");
    expect(resolveSizeFieldKey("medium")).toBe("mediumQuantity");
    expect(resolveSizeFieldKey("x-l")).toBe("xlQuantity");
    expect(resolveSizeFieldKey("2XL")).toBe("xxlQuantity");
  });

  it("returns null for unknown sizes", () => {
    expect(resolveSizeFieldKey("3XL")).toBeNull();
    expect(resolveSizeFieldKey("one size")).toBeNull();
  });

  it("supports ONE_SIZE marker and detects non-sized products", () => {
    expect(NON_SIZED_KEY).toBe("ONE_SIZE");
    expect(hasSizeVariants({ hasSizes: false, stockQuantity: 12 })).toBe(false);
    expect(hasSizeVariants({ sizes: ["ONE_SIZE"], stockQuantity: 8 })).toBe(false);
    expect(hasSizeVariants({ smallQuantity: 2 })).toBe(true);
  });

  it("computes total stock from sizes for sized products and stockQuantity for non-sized", () => {
    expect(
      getTotalStockQuantity({
        hasSizes: true,
        smallQuantity: 2,
        mediumQuantity: 3,
        largeQuantity: 4,
        xlQuantity: 1,
      })
    ).toBe(10);

    expect(
      getTotalStockQuantity({
        hasSizes: false,
        stockQuantity: 17,
      })
    ).toBe(17);
  });
});
