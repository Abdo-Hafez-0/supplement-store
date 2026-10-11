import { describe, expect, it } from "vitest";
import { describeTier, divideRoundHalfUp, perBottleCents, priceForQuantity, tierForQuantity } from "@/lib/pricing";

const tiers = [
  { bottles: 1, bundlePriceCents: 3999 },
  { bottles: 2, bundlePriceCents: 6999 },
  { bottles: 3, bundlePriceCents: 8999 },
];

describe("divideRoundHalfUp", () => {
  it.each([
    [3999, 2, 2000], // 1999.5 -> 2000
    [8999, 3, 3000], // 2999.67 -> 3000
    [9499, 3, 3166], // 3166.33 -> 3166
    [10, 4, 3], // 2.5 -> 3
    [6, 4, 2], // 1.5 -> 2
    [0, 3, 0],
  ])("%i / %i = %i", (a, b, expected) => {
    expect(divideRoundHalfUp(a, b)).toBe(expected);
  });

  it("rejects floats and division by zero", () => {
    expect(() => divideRoundHalfUp(39.99, 2)).toThrow(TypeError);
    expect(() => divideRoundHalfUp(100, 0)).toThrow(RangeError);
  });
});

describe("describeTier", () => {
  it("compares the bundle with the regular price for the same bottles", () => {
    expect(describeTier({ bottles: 3, bundlePriceCents: 8999 }, 4999)).toEqual({
      bundlePriceCents: 8999,
      perBottleCents: 3000,
      compareAtCents: 14997,
      savingsCents: 5998,
      savingsPercent: 39, // 39.99% rounded down
    });
  });

  it("never shows negative savings", () => {
    expect(describeTier({ bottles: 1, bundlePriceCents: 5999 }, 4999).savingsCents).toBe(0);
  });
});

describe("tierForQuantity", () => {
  it("picks the largest tier at or below the quantity", () => {
    expect(tierForQuantity(tiers, 2)?.bottles).toBe(2);
    expect(tierForQuantity(tiers, 7)?.bottles).toBe(3);
    expect(tierForQuantity([{ bottles: 2, bundlePriceCents: 1 }], 1)).toBeNull();
  });
});

describe("priceForQuantity", () => {
  it("uses the bundle price when the quantity matches a tier", () => {
    expect(priceForQuantity(tiers, 4999, 2)).toBe(6999);
  });

  it("charges the top tier's rounded per-bottle price above the top tier", () => {
    // 8999 / 3 = 2999.67 -> 3000 per bottle
    expect(perBottleCents(tiers[2])).toBe(3000);
    expect(priceForQuantity(tiers, 4999, 5)).toBe(15000);
  });

  it("uses the regular price without tiers", () => {
    expect(priceForQuantity([], 4999, 3)).toBe(14997);
  });

  it("uses the regular price below the smallest tier", () => {
    expect(priceForQuantity([{ bottles: 2, bundlePriceCents: 7000 }], 4999, 1)).toBe(4999);
  });

  it("prices a gap between tiers per bottle at the tier below", () => {
    const gapped = [
      { bottles: 1, bundlePriceCents: 3999 },
      { bottles: 3, bundlePriceCents: 8999 },
    ];
    expect(priceForQuantity(gapped, 4999, 2)).toBe(7998);
  });
});
