// Which gift a tier gives right now. Shared by the product page (M2) and the cart (M3).

export type GiftRule = {
  giftProductId: number;
  substituteProductId: number | null;
  /** null = bottles - 1 */
  giftQty: number | null;
};

export type GiftCandidate = {
  id: number;
  title: string;
  stock: number;
  status: "draft" | "active" | "unlisted";
};

export type ResolvedGift<P extends GiftCandidate = GiftCandidate> = {
  product: P;
  quantity: number;
  isSubstitute: boolean;
};

export function giftQuantity(bottles: number, rule: Pick<GiftRule, "giftQty">): number {
  return Math.max(0, rule.giftQty ?? bottles - 1);
}

/** A gift is available when it is not a draft and has stock for the whole gift quantity. */
function isAvailable(product: GiftCandidate | undefined, quantity: number): product is GiftCandidate {
  return Boolean(product && product.status !== "draft" && product.stock >= quantity);
}

/**
 * The gift for a tier: the gift product if it has stock, else its substitute,
 * else none (the tier then shows no gift and the gift text is hidden).
 */
export function resolveGift<P extends GiftCandidate>(
  bottles: number,
  rule: GiftRule | null,
  productsById: ReadonlyMap<number, P>,
): ResolvedGift<P> | null {
  if (!rule) return null;
  const quantity = giftQuantity(bottles, rule);
  if (quantity === 0) return null;

  const gift = productsById.get(rule.giftProductId);
  if (isAvailable(gift, quantity)) return { product: gift as P, quantity, isSubstitute: false };

  const substitute = rule.substituteProductId === null ? undefined : productsById.get(rule.substituteProductId);
  if (isAvailable(substitute, quantity)) return { product: substitute as P, quantity, isSubstitute: true };

  return null;
}
