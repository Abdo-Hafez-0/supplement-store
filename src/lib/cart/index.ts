import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { cookies } from "next/headers";
import type { Db } from "@/lib/db/client";
import { cartItems, carts, orderBumps, products, productTiers, tierGifts } from "@/lib/db/schema";
import { priceCart, type CatalogProduct, type PricedCart } from "@/lib/pricing";
import type { Settings } from "@/lib/settings/schema";
import { offerActive } from "@/lib/timer";
import { getVisitorTimer } from "@/lib/timer/server";

// Server cart: a guest cart keyed by a random id in an httpOnly cookie. Every read
// and change re-prices it from the database with priceCart() and stores the result
// (gift lines, corrected quantities), so the stored cart always matches the engine.

export const CART_COOKIE = "cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The cart id from the cookie, if it looks valid (it may still not exist in D1). */
export async function readCartId(): Promise<string | null> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}

/** The visitor's cart id, creating the cart (and its cookie) when needed. Route handlers only. */
export async function ensureCart(db: Db): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    const [row] = await db.select({ id: carts.id }).from(carts).where(eq(carts.id, existing));
    if (row) return row.id;
  }
  const id = crypto.randomUUID();
  await db.insert(carts).values({ id });
  const { env } = getCloudflareContext();
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: env.NEXTJS_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return id;
}

/** Products in the cart plus every gift, substitute and bump product they can bring, as the engine needs them. */
export async function loadCatalog(db: Db, productIds: number[]): Promise<Map<number, CatalogProduct>> {
  const catalog = new Map<number, CatalogProduct>();
  if (!productIds.length) return catalog;

  const tierRows = await db
    .select({ tier: productTiers, gift: tierGifts })
    .from(productTiers)
    .leftJoin(tierGifts, eq(tierGifts.tierId, productTiers.id))
    .where(inArray(productTiers.productId, productIds));
  const giftIds = tierRows.flatMap(({ gift }) =>
    gift ? [gift.giftProductId, ...(gift.substituteProductId ? [gift.substituteProductId] : [])] : [],
  );
  const bumps = await db
    .select({
      productId: orderBumps.productId,
      bumpProductId: orderBumps.bumpProductId,
      bumpPriceCents: orderBumps.bumpPriceCents,
      headline: orderBumps.headline,
    })
    .from(orderBumps)
    .where(inArray(orderBumps.productId, productIds));

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      status: products.status,
      stock: products.stock,
      regularPriceCents: products.regularPriceCents,
      images: products.images,
    })
    .from(products)
    .where(inArray(products.id, [...new Set([...productIds, ...giftIds, ...bumps.map((b) => b.bumpProductId)])]));

  for (const row of rows) {
    const tiers = tierRows
      .filter(({ tier }) => tier.productId === row.id)
      .map(({ tier, gift }) => ({
        bottles: tier.bottles,
        bundlePriceCents: tier.bundlePriceCents,
        gift: gift
          ? { giftProductId: gift.giftProductId, substituteProductId: gift.substituteProductId, giftQty: gift.giftQty }
          : null,
      }));
    const bump = bumps.find((b) => b.productId === row.id);
    catalog.set(row.id, {
      ...row,
      tiers,
      bump: bump
        ? { bumpProductId: bump.bumpProductId, bumpPriceCents: bump.bumpPriceCents, headline: bump.headline }
        : null,
    });
  }
  return catalog;
}

export type CartView = PricedCart & { cartId: string | null };

const emptyCart = (cartId: string | null): CartView => ({
  cartId,
  lines: [],
  bump: null,
  staleBumpLineId: null,
  removed: [],
  subtotalCents: 0,
  compareAtTotalCents: 0,
  savingsCents: 0,
  itemCount: 0,
});

/**
 * Prices the cart and makes the stored rows match: removes lines that can't be
 * bought, lowers quantities the engine lowered, and rewrites gift lines when the
 * gifts changed (quantity, substitution, stock).
 */
export async function getPricedCart(db: Db, cartId: string | null, settings: Settings): Promise<CartView> {
  if (!cartId) return emptyCart(null);
  const rows = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.id));
  if (!rows.length) return emptyCart(cartId);

  const paidRows = rows.filter((row) => !row.isGift && !row.isBump);
  const giftRows = rows.filter((row) => row.isGift);
  const [bumpRow, ...extraBumpRows] = rows.filter((row) => row.isBump);
  const catalog = await loadCatalog(db, [...new Set(paidRows.map((row) => row.productId))]);
  const { state } = await getVisitorTimer(settings.timer);
  const cart = priceCart(paidRows, catalog, {
    offerActive: offerActive(state),
    maxQuantityPerLine: settings.limits.maxQuantityPerLine,
    acceptedBump: bumpRow ? { id: bumpRow.id, productId: bumpRow.productId } : null,
  });

  const statements: BatchItem<"sqlite">[] = [];
  // One bump at a time; drop it when it no longer applies
  for (const stale of [...extraBumpRows.map((row) => row.id), ...(cart.staleBumpLineId ? [cart.staleBumpLineId] : [])]) {
    statements.push(db.delete(cartItems).where(eq(cartItems.id, stale)));
  }
  // Gift rows cascade with their parent line
  for (const removed of cart.removed) statements.push(db.delete(cartItems).where(eq(cartItems.id, removed.lineId)));
  for (const line of cart.lines) {
    const stored = paidRows.find((row) => row.id === line.id);
    if (stored && stored.quantity !== line.quantity) {
      statements.push(db.update(cartItems).set({ quantity: line.quantity }).where(eq(cartItems.id, line.id)));
    }
  }

  const desired = cart.lines.flatMap((line) =>
    line.gift ? [{ parentItemId: line.id, productId: line.gift.productId, quantity: line.gift.quantity }] : [],
  );
  const key = (g: { parentItemId: number | null; productId: number; quantity: number }) =>
    `${g.parentItemId}:${g.productId}:${g.quantity}`;
  const giftsChanged =
    desired.length !== giftRows.length || desired.map(key).sort().join() !== giftRows.map(key).sort().join();
  if (giftsChanged) {
    statements.push(db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.isGift, true))));
    if (desired.length) {
      statements.push(db.insert(cartItems).values(desired.map((gift) => ({ ...gift, cartId, isGift: true }))));
    }
  }

  if (statements.length) {
    statements.push(db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId)));
    const [first, ...rest] = statements;
    await db.batch([first, ...rest]);
  }
  return { ...cart, cartId };
}

/** Adds bottles of a product: one paid line per product, so a repeat add raises its quantity. */
export async function addToCart(db: Db, cartId: string, productId: number, quantity: number) {
  const [existing] = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId),
        eq(cartItems.isGift, false),
        eq(cartItems.isBump, false),
      ),
    );
  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: Math.min(999, existing.quantity + quantity) })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId, productId, quantity, isGift: false });
  }
}

/** Sets a paid line's quantity (0 removes it). Gift and bump lines can't be changed: returns false. */
export async function setLineQuantity(db: Db, cartId: string, lineId: number, quantity: number) {
  const [line] = await db
    .select({ id: cartItems.id, isGift: cartItems.isGift, isBump: cartItems.isBump })
    .from(cartItems)
    .where(and(eq(cartItems.id, lineId), eq(cartItems.cartId, cartId)));
  if (!line || line.isGift || line.isBump) return false;
  if (quantity === 0) await db.delete(cartItems).where(eq(cartItems.id, lineId));
  else await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, lineId));
  return true;
}

/**
 * Accepts or declines the order bump on offer. The browser only says yes or no:
 * which bump applies and its price always come from the server.
 * Returns false when accepting but no bump is on offer.
 */
export async function setBump(db: Db, cartId: string, accept: boolean, settings: Settings) {
  const removeBumps = db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.isBump, true)));
  if (!accept) {
    await removeBumps;
    return true;
  }
  const { bump } = await getPricedCart(db, cartId, settings);
  if (!bump) return false;
  if (bump.accepted) return true;
  await db.batch([
    removeBumps,
    db.insert(cartItems).values({ cartId, productId: bump.productId, quantity: 1, isBump: true }),
  ]);
  return true;
}
