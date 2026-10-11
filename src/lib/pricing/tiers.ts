// Tier price math, shared by the product page (M2) and the cart pricing engine (M3).
// All amounts are integer cents.

export type TierPrice = { bottles: number; bundlePriceCents: number };

function assertCents(...values: number[]) {
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("Amounts must be non-negative integers");
  }
}

/** a / b rounded to the nearest integer, halves up, without floating point. */
export function divideRoundHalfUp(a: number, b: number): number {
  assertCents(a, b);
  if (b === 0) throw new RangeError("Division by zero");
  return Math.floor((2 * a + b) / (2 * b));
}

/** Per-bottle price of a tier, rounded to the nearest cent (rule agreed 2026-10-11). */
export function perBottleCents(tier: TierPrice): number {
  return divideRoundHalfUp(tier.bundlePriceCents, tier.bottles);
}

/** What the tier card shows: bundle price against `bottles` at the regular price. */
export function describeTier(tier: TierPrice, regularPriceCents: number) {
  assertCents(tier.bundlePriceCents, regularPriceCents, tier.bottles);
  const compareAtCents = regularPriceCents * tier.bottles;
  const savingsCents = Math.max(0, compareAtCents - tier.bundlePriceCents);
  return {
    bundlePriceCents: tier.bundlePriceCents,
    perBottleCents: perBottleCents(tier),
    compareAtCents,
    savingsCents,
    /** Whole percent, rounded down so we never overstate the discount */
    savingsPercent: compareAtCents > 0 ? Math.floor((savingsCents * 100) / compareAtCents) : 0,
  };
}

/**
 * The tier that applies to a quantity: the largest tier whose bottle count is
 * <= quantity. Above the top tier, the top tier applies per bottle (see priceForQuantity).
 */
export function tierForQuantity<T extends TierPrice>(tiers: readonly T[], quantity: number): T | null {
  let best: T | null = null;
  for (const tier of tiers) {
    if (tier.bottles <= quantity && (!best || tier.bottles > best.bottles)) best = tier;
  }
  return best;
}

/**
 * Price for `quantity` bottles. Exact tier match: its bundle price. Above the top
 * tier: the top tier's rounded per-bottle price x quantity. No tiers, or below the
 * smallest tier: regular price x quantity.
 */
export function priceForQuantity(tiers: readonly TierPrice[], regularPriceCents: number, quantity: number): number {
  assertCents(regularPriceCents, quantity);
  const exact = tiers.find((tier) => tier.bottles === quantity);
  if (exact) return exact.bundlePriceCents;
  const top = tiers.reduce<TierPrice | null>((max, tier) => (!max || tier.bottles > max.bottles ? tier : max), null);
  if (top && quantity > top.bottles) return perBottleCents(top) * quantity;
  const below = tierForQuantity(tiers, quantity);
  if (below) return perBottleCents(below) * quantity;
  return regularPriceCents * quantity;
}
