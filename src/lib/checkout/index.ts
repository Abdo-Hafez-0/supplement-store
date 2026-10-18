import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, eq } from "drizzle-orm";
import { getPricedCart, type CartView } from "@/lib/cart";
import type { Db } from "@/lib/db/client";
import { shippingMethods } from "@/lib/db/schema";
import { orderTotals, type OrderTotals, type ShippingOption } from "@/lib/orders";
import type { Settings } from "@/lib/settings/schema";

// Checkout pricing: the cart is priced again from the database (rule 2) and
// shipping is added on the server. The browser only picks a shipping method id.

export async function activeShippingOptions(db: Db): Promise<ShippingOption[]> {
  return db
    .select({
      id: shippingMethods.id,
      name: shippingMethods.name,
      deliveryText: shippingMethods.deliveryText,
      priceCents: shippingMethods.priceCents,
      freeOverCents: shippingMethods.freeOverCents,
    })
    .from(shippingMethods)
    .where(eq(shippingMethods.isActive, true))
    .orderBy(asc(shippingMethods.sortOrder), asc(shippingMethods.id));
}

export type CheckoutQuote =
  | { ok: true; cart: CartView; method: ShippingOption; totals: OrderTotals }
  | {
      ok: false;
      /** empty_cart: nothing to buy; cart_changed: the cart was corrected and must be reviewed; shipping: method not available */
      reason: "empty_cart" | "cart_changed" | "shipping";
      cart: CartView;
    };

export async function quoteCheckout(
  db: Db,
  cartId: string | null,
  settings: Settings,
  shippingMethodId: number,
): Promise<CheckoutQuote> {
  const [cart, [method]] = await Promise.all([
    getPricedCart(db, cartId, settings),
    db
      .select({
        id: shippingMethods.id,
        name: shippingMethods.name,
        deliveryText: shippingMethods.deliveryText,
        priceCents: shippingMethods.priceCents,
        freeOverCents: shippingMethods.freeOverCents,
      })
      .from(shippingMethods)
      .where(and(eq(shippingMethods.id, shippingMethodId), eq(shippingMethods.isActive, true))),
  ]);
  if (!cart.lines.length) return { ok: false, reason: "empty_cart", cart };
  // Something was removed or lowered since the shopper last saw the cart: show it first
  if (cart.removed.length || cart.lines.some((line) => line.issues.length)) {
    return { ok: false, reason: "cart_changed", cart };
  }
  if (!method) return { ok: false, reason: "shipping", cart };
  return { ok: true, cart, method, totals: orderTotals(cart, method) };
}

export const quoteErrors: Record<Exclude<CheckoutQuote, { ok: true }>["reason"], string> = {
  empty_cart: "Your cart is empty.",
  cart_changed: "Your cart was updated (stock or availability changed). Please review it before paying.",
  shipping: "That shipping method is no longer available. Please choose another.",
};

/**
 * Whether real payments can be taken. PayPal is connected in the second half of M4;
 * until its credentials are set, the Pay step stays switched off.
 */
export function paymentsConnected() {
  const env = getCloudflareContext().env as unknown as Record<string, string | undefined>;
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}

/** Local development only: lets a developer place a test order without PayPal. */
export function testOrdersAllowed() {
  return getCloudflareContext().env.NEXTJS_ENV === "development";
}
