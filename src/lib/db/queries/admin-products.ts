import "server-only";
import { asc, count, eq, inArray, or } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { orderBumps, products, productTiers, reviewImages, tierGifts } from "@/lib/db/schema";

export async function listProductsForAdmin(db: Db) {
  const [rows, tierCounts] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.title)),
    db
      .select({ productId: productTiers.productId, value: count() })
      .from(productTiers)
      .groupBy(productTiers.productId),
  ]);
  const tiersByProduct = new Map(tierCounts.map((row) => [row.productId, row.value]));
  return rows.map((product) => ({ ...product, tierCount: tiersByProduct.get(product.id) ?? 0 }));
}

/** Products that can be picked as a gift, substitute or bump (anything not in draft). */
export async function listProductOptions(db: Db) {
  return db
    .select({ id: products.id, title: products.title, status: products.status, stock: products.stock })
    .from(products)
    .orderBy(asc(products.title));
}

export async function getProductForAdmin(db: Db, id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;

  const [tiers, bump, reviews] = await Promise.all([
    db
      .select({ tier: productTiers, gift: tierGifts })
      .from(productTiers)
      .leftJoin(tierGifts, eq(tierGifts.tierId, productTiers.id))
      .where(eq(productTiers.productId, id))
      .orderBy(asc(productTiers.sortOrder), asc(productTiers.bottles)),
    db.select().from(orderBumps).where(eq(orderBumps.productId, id)),
    db
      .select()
      .from(reviewImages)
      .where(eq(reviewImages.productId, id))
      .orderBy(asc(reviewImages.sortOrder), asc(reviewImages.id)),
  ]);

  return {
    product,
    tiers: tiers.map(({ tier, gift }) => ({ ...tier, gift })),
    bump: bump[0] ?? null,
    reviewImages: reviews,
  };
}

/** Where a product is used by other products; deleting it would break these. */
export async function findProductUsage(db: Db, id: number) {
  const [asGift, asBump] = await Promise.all([
    db
      .selectDistinct({ title: products.title })
      .from(tierGifts)
      .innerJoin(productTiers, eq(productTiers.id, tierGifts.tierId))
      .innerJoin(products, eq(products.id, productTiers.productId))
      .where(or(eq(tierGifts.giftProductId, id), eq(tierGifts.substituteProductId, id))),
    db
      .selectDistinct({ title: products.title })
      .from(orderBumps)
      .innerJoin(products, eq(products.id, orderBumps.productId))
      .where(eq(orderBumps.bumpProductId, id)),
  ]);
  return { asGift: asGift.map((row) => row.title), asBump: asBump.map((row) => row.title) };
}

export async function productIdsExist(db: Db, ids: number[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return true;
  const [row] = await db.select({ value: count() }).from(products).where(inArray(products.id, unique));
  return (row?.value ?? 0) === unique.length;
}
