import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { products, productTiers, reviewImages, tierGifts } from "@/lib/db/schema";
import { describeTier, perBottleCents, resolveGift } from "@/lib/pricing";

// Storefront reads. Drafts are never returned; "unlisted" products open by URL but
// stay out of the listing.

const cardColumns = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  shortDescription: products.shortDescription,
  regularPriceCents: products.regularPriceCents,
  stock: products.stock,
  images: products.images,
  isFeatured: products.isFeatured,
};

export type ProductCardData = Awaited<ReturnType<typeof listStoreProducts>>[number];

/** Active products for the listing, each with its lowest per-bottle price. */
export async function listStoreProducts(db: Db, options: { featuredOnly?: boolean } = {}) {
  const rows = await db
    .select(cardColumns)
    .from(products)
    .where(
      options.featuredOnly
        ? and(eq(products.status, "active"), eq(products.isFeatured, true))
        : eq(products.status, "active"),
    )
    .orderBy(asc(products.sortOrder), asc(products.title));
  if (!rows.length) return [];

  const tiers = await db
    .select({ productId: productTiers.productId, bottles: productTiers.bottles, bundlePriceCents: productTiers.bundlePriceCents })
    .from(productTiers)
    .where(inArray(productTiers.productId, rows.map((row) => row.id)));

  return rows.map((product) => {
    const own = tiers.filter((tier) => tier.productId === product.id);
    const lowestPerBottle = own.length ? Math.min(...own.map(perBottleCents)) : null;
    return {
      ...product,
      /** Lowest price per bottle across tiers, or null without tiers */
      fromPerBottleCents: lowestPerBottle !== null && lowestPerBottle < product.regularPriceCents ? lowestPerBottle : null,
    };
  });
}

/** Everything the product page needs, or null for unknown and draft products. */
export async function getStoreProduct(db: Db, slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), ne(products.status, "draft")));
  if (!product) return null;

  const [tierRows, reviews] = await Promise.all([
    db
      .select({ tier: productTiers, gift: tierGifts })
      .from(productTiers)
      .leftJoin(tierGifts, eq(tierGifts.tierId, productTiers.id))
      .where(eq(productTiers.productId, product.id))
      .orderBy(asc(productTiers.sortOrder), asc(productTiers.bottles)),
    db
      .select({ id: reviewImages.id, fileKey: reviewImages.fileKey, alt: reviewImages.alt })
      .from(reviewImages)
      .where(eq(reviewImages.productId, product.id))
      .orderBy(asc(reviewImages.sortOrder), asc(reviewImages.id)),
  ]);

  // Load gift and substitute products in one query to resolve availability.
  const giftIds = [
    ...new Set(
      tierRows.flatMap(({ gift }) =>
        gift ? [gift.giftProductId, ...(gift.substituteProductId ? [gift.substituteProductId] : [])] : [],
      ),
    ),
  ];
  const giftProducts = giftIds.length
    ? await db
        .select({ id: products.id, title: products.title, stock: products.stock, status: products.status, images: products.images })
        .from(products)
        .where(inArray(products.id, giftIds))
    : [];
  const giftsById = new Map(giftProducts.map((gift) => [gift.id, gift]));

  const tiers = tierRows.map(({ tier, gift }) => {
    const resolved = resolveGift(tier.bottles, gift, giftsById);
    return {
      id: tier.id,
      bottles: tier.bottles,
      badgeLabel: tier.badgeLabel,
      isDefault: tier.isDefault,
      ...describeTier(tier, product.regularPriceCents),
      gift: resolved
        ? {
            productId: resolved.product.id,
            title: resolved.product.title,
            image: resolved.product.images[0] ?? null,
            quantity: resolved.quantity,
          }
        : null,
    };
  });

  return { product, tiers, reviews };
}

export type StoreProduct = NonNullable<Awaited<ReturnType<typeof getStoreProduct>>>;
export type StoreTier = StoreProduct["tiers"][number];
