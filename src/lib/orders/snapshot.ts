// Pure order math: shipping cost, totals and the order_items snapshot of a priced
// cart (CLAUDE.md rule 4: orders copy prices at purchase time).

import type { PricedCart } from "@/lib/pricing";

export type ShippingOption = {
  id: number;
  name: string;
  deliveryText: string;
  priceCents: number;
  freeOverCents: number | null;
};

/** Free when the subtotal reaches the method's "free over" amount. */
export function shippingCentsFor(method: Pick<ShippingOption, "priceCents" | "freeOverCents">, subtotalCents: number) {
  return method.freeOverCents !== null && subtotalCents >= method.freeOverCents ? 0 : method.priceCents;
}

export type OrderItemSnapshot = {
  productId: number;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  isGift: boolean;
  isBump: boolean;
  /** For gift lines: the paid product whose line earned the gift */
  parentProductId: number | null;
};

/**
 * Paid lines, then the accepted bump, then one gift line per paid line. The line total
 * is the engine's (bundle prices don't always divide evenly); unitPriceCents is that
 * total divided and rounded, for display.
 */
export function orderItemsFromCart(cart: PricedCart): OrderItemSnapshot[] {
  const paid = cart.lines.map((line) => ({
    productId: line.productId,
    productName: line.title,
    unitPriceCents: line.unitPriceCents,
    quantity: line.quantity,
    lineTotalCents: line.lineTotalCents,
    isGift: false,
    isBump: false,
    parentProductId: null,
  }));
  const bump = cart.bump?.accepted
    ? [
        {
          productId: cart.bump.productId,
          productName: cart.bump.title,
          unitPriceCents: cart.bump.priceCents,
          quantity: 1,
          lineTotalCents: cart.bump.priceCents,
          isGift: false,
          isBump: true,
          parentProductId: null,
        },
      ]
    : [];
  const gifts = cart.lines.flatMap((line) =>
    line.gift
      ? [
          {
            productId: line.gift.productId,
            productName: line.gift.title,
            unitPriceCents: 0,
            quantity: line.gift.quantity,
            lineTotalCents: 0,
            isGift: true,
            isBump: false,
            parentProductId: line.productId,
          },
        ]
      : [],
  );
  return [...paid, ...bump, ...gifts];
}

export type OrderTotals = { subtotalCents: number; shippingCents: number; totalCents: number };

export function orderTotals(cart: PricedCart, method: Pick<ShippingOption, "priceCents" | "freeOverCents">): OrderTotals {
  const shippingCents = shippingCentsFor(method, cart.subtotalCents);
  return { subtotalCents: cart.subtotalCents, shippingCents, totalCents: cart.subtotalCents + shippingCents };
}

/** Bottles to take from stock per product: paid lines, the bump and gifts alike. */
export function stockToTake(items: Pick<OrderItemSnapshot, "productId" | "quantity">[]) {
  const totals = new Map<number, number>();
  for (const item of items) totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  return totals;
}

const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L

/** Random public order number, e.g. "DX-7K3M9QX2". Not sequential, so it doesn't reveal order volume. */
export function generateOrderNumber(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)) {
  const bytes = random(new Uint8Array(8));
  let out = "";
  for (const byte of bytes) out += ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length];
  return `DX-${out}`;
}

export const ORDER_NUMBER_PATTERN = /^DX-[2-9A-HJKMNP-Z]{8}$/;
