import { centsToDollarInput } from "@/lib/money";

// Shared by the server page and the client tier editor.

export type ProductOption = { id: number; title: string; status: string; stock: number };

export type TierRow = {
  rowId: string;
  bottles: string;
  bundlePrice: string;
  badgeLabel: string;
  isDefault: boolean;
  hasGift: boolean;
  giftProductId: string;
  substituteProductId: string;
  giftQty: string;
};

export function tierRowsFromDb(
  tiers: {
    id: number;
    bottles: number;
    bundlePriceCents: number;
    badgeLabel: string | null;
    isDefault: boolean;
    gift: { giftProductId: number; substituteProductId: number | null; giftQty: number | null } | null;
  }[],
): TierRow[] {
  return tiers.map((tier) => ({
    rowId: String(tier.id),
    bottles: String(tier.bottles),
    bundlePrice: centsToDollarInput(tier.bundlePriceCents),
    badgeLabel: tier.badgeLabel ?? "",
    isDefault: tier.isDefault,
    hasGift: tier.gift !== null,
    giftProductId: tier.gift ? String(tier.gift.giftProductId) : "",
    substituteProductId: tier.gift?.substituteProductId ? String(tier.gift.substituteProductId) : "",
    giftQty: tier.gift?.giftQty === null || tier.gift?.giftQty === undefined ? "" : String(tier.gift.giftQty),
  }));
}
