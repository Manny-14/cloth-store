import { describe, expect, it } from "vitest";
import { normalizeSizeLabel, resolveSizeFieldKey } from "../inventory";

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
});
