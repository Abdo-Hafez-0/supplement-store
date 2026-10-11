// The cart pricing engine. Pure: it takes the cart lines (product ids and
// quantities only, never prices) and the catalog as read from the database, and
// returns every price, gift and correction. Called on every cart change and again
// at checkout (CLAUDE.md rules 1-3).

import { resolveGift, type GiftCandidate, type GiftRule } from "./gifts";
import { divideRoundHalfUp, priceForQuantity, tierForQuantity, type TierPrice } from "./tiers";

export type CatalogTier = TierPrice & { gift: GiftRule | null };

export type CatalogProduct = GiftCandidate & {
  slug: string;
  regularPriceCents: number;
  images: string[];
  tiers: CatalogTier[];
};

/** A paid line as stored in the cart. Gift lines are never input: the engine derives them. */
export type CartLineInput = { id: number; productId: number; quantity: number };

export type LineIssue =
  /** Fewer in stock than requested; quantity lowered */
  | "reduced_to_stock"
  /** Over the store's per-product cap; quantity lowered */
  | "reduced_to_max";

export type RemovedReason = "unavailable" | "out_of_stock";

export type PricedGift = {
  productId: number;
  title: string;
  slug: string;
  image: string | null;
  quantity: number;
  /** The tier's gift was out of stock, so its substitute is given */
  isSubstitute: boolean;
};

export type PricedLine = {
  id: number;
  productId: number;
  title: string;
  slug: string;
  image: string | null;
  quantity: number;
  /** Bottle count of the tier the price came from, or null (regular price) */
  tierBottles: number | null;
  lineTotalCents: number;
  /** Rounded line total / quantity, for display and order snapshots */
  unitPriceCents: number;
  /** Regular price x quantity (struck-through price) */
  compareAtCents: number;
  gift: PricedGift | null;
  issues: LineIssue[];
};

export type PricedCart = {
  lines: PricedLine[];
  /** Lines dropped because the product can't be bought any more */
  removed: { lineId: number; productId: number; title: string | null; reason: RemovedReason }[];
  subtotalCents: number;
  compareAtTotalCents: number;
  savingsCents: number;
  /** Paid bottles plus gift bottles */
  itemCount: number;
};

export type PriceCartOptions = {
  /** False while the visitor's offer timer has expired: regular prices apply */
  offerActive: boolean;
  /** Settings > Cart limits; null = no cap */
  maxQuantityPerLine: number | null;
};

const purchasable = (product: CatalogProduct | undefined): product is CatalogProduct =>
  Boolean(product && product.status !== "draft");

export function priceCart(
  lines: readonly CartLineInput[],
  catalog: ReadonlyMap<number, CatalogProduct>,
  options: PriceCartOptions,
): PricedCart {
  // Stock left after what earlier lines took. Paid lines are allocated before any
  // gift, so a gift never takes the bottles a customer is paying for.
  const remaining = new Map<number, number>();
  const stockLeft = (product: CatalogProduct) => remaining.get(product.id) ?? product.stock;
  const take = (productId: number, stock: number, quantity: number) => remaining.set(productId, stock - quantity);

  const removed: PricedCart["removed"] = [];
  const paid: Omit<PricedLine, "gift">[] = [];

  for (const line of lines) {
    const product = catalog.get(line.productId);
    if (!purchasable(product)) {
      const title = catalog.get(line.productId)?.title ?? null;
      removed.push({ lineId: line.id, productId: line.productId, title, reason: "unavailable" });
      continue;
    }
    const available = stockLeft(product);
    if (available <= 0) {
      removed.push({ lineId: line.id, productId: product.id, title: product.title, reason: "out_of_stock" });
      continue;
    }

    const issues: LineIssue[] = [];
    let quantity = line.quantity;
    if (options.maxQuantityPerLine !== null && quantity > options.maxQuantityPerLine) {
      quantity = options.maxQuantityPerLine;
      issues.push("reduced_to_max");
    }
    if (quantity > available) {
      quantity = available;
      issues.push("reduced_to_stock");
    }
    take(product.id, available, quantity);

    const tiers = options.offerActive ? product.tiers : [];
    const lineTotalCents = priceForQuantity(tiers, product.regularPriceCents, quantity);
    paid.push({
      id: line.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: product.images[0] ?? null,
      quantity,
      tierBottles: tierForQuantity(tiers, quantity)?.bottles ?? null,
      lineTotalCents,
      unitPriceCents: divideRoundHalfUp(lineTotalCents, quantity),
      compareAtCents: product.regularPriceCents * quantity,
      issues,
    });
  }

  // Gifts: the rule of the tier the real quantity falls in (above the top tier, the
  // top tier's). Each line gets its own gift line, even when the gift is the same
  // product. Gifts still apply while the offer timer has expired.
  const priced: PricedLine[] = paid.map((line) => {
    const product = catalog.get(line.productId)!;
    const rule = tierForQuantity(product.tiers, line.quantity)?.gift ?? null;
    const withStock = new Map(
      [...catalog].map(([id, candidate]) => [id, { ...candidate, stock: stockLeft(candidate) }] as const),
    );
    const gift = resolveGift(line.quantity, rule, withStock);
    if (!gift) return { ...line, gift: null };
    take(gift.product.id, gift.product.stock, gift.quantity);
    return {
      ...line,
      gift: {
        productId: gift.product.id,
        title: gift.product.title,
        slug: gift.product.slug,
        image: gift.product.images[0] ?? null,
        quantity: gift.quantity,
        isSubstitute: gift.isSubstitute,
      },
    };
  });

  const subtotalCents = priced.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const compareAtTotalCents = priced.reduce((sum, line) => sum + line.compareAtCents, 0);
  return {
    lines: priced,
    removed,
    subtotalCents,
    compareAtTotalCents,
    savingsCents: Math.max(0, compareAtTotalCents - subtotalCents),
    itemCount: priced.reduce((sum, line) => sum + line.quantity + (line.gift?.quantity ?? 0), 0),
  };
}
