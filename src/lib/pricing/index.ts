// Pricing engine: pure functions over integer cents. The cart engine lands in M3.

export * from "./gifts";
export * from "./tiers";

/** Line total in integer cents. Rejects non-integer inputs instead of rounding. */
export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  if (!Number.isSafeInteger(unitPriceCents) || !Number.isSafeInteger(quantity)) {
    throw new TypeError("Prices and quantities must be integers");
  }
  return unitPriceCents * quantity;
}
