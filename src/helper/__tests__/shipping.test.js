import { describe, expect, it } from "vitest";
import { calculateShippingFee, estimateCartWeightKg } from "../shipping";

describe("shipping helpers", () => {
  it("applies standard shipping fee below free-shipping threshold", () => {
    const fee = calculateShippingFee({
      subtotal: 120,
      deliveryMethod: "standard_shipping",
      estimatedWeightKg: 1.5,
    });

    expect(fee).toBe(7.99);
  });

  it("applies free standard shipping at and above $150", () => {
    expect(
      calculateShippingFee({
        subtotal: 150,
        deliveryMethod: "standard_shipping",
        estimatedWeightKg: 0,
      })
    ).toBe(0);

    expect(
      calculateShippingFee({
        subtotal: 200,
        deliveryMethod: "standard_shipping",
        estimatedWeightKg: 0,
      })
    ).toBe(0);
  });

  it("applies doorstep discount after free-shipping threshold", () => {
    const fee = calculateShippingFee({
      subtotal: 180,
      deliveryMethod: "doorstep_delivery",
      estimatedWeightKg: 1,
    });

    expect(fee).toBe(8.99);
  });

  it("adds weight surcharge for heavy carts", () => {
    const midWeightFee = calculateShippingFee({
      subtotal: 120,
      deliveryMethod: "standard_shipping",
      estimatedWeightKg: 4.2,
    });
    const highWeightFee = calculateShippingFee({
      subtotal: 200,
      deliveryMethod: "standard_shipping",
      estimatedWeightKg: 8.5,
    });

    expect(midWeightFee).toBe(9.99); // 7.99 + 2
    expect(highWeightFee).toBe(4); // free + 4 surcharge
  });

  it("estimates cart weight using product type heuristics", () => {
    const weight = estimateCartWeightKg([
      { productName: "Premium Towel", quantity: 2 },
      { name: "Cozy Hoodie", quantity: 1 },
      { name: "Shirt", quantity: 3 },
    ]);

    // 2*0.8 + 1*0.7 + 3*0.35 = 3.35
    expect(weight).toBeCloseTo(3.35, 4);
  });
});
