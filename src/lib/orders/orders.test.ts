import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { cartItems, carts, orderItems, orders, products, shippingMethods } from "@/lib/db/schema";
import type { Db } from "@/lib/db/client";
import { priceCart, type CatalogProduct, type PricedCart } from "@/lib/pricing";
import type { CheckoutDetails } from "@/lib/validation/checkout";
import { createTestDb } from "@/test/sqlite-db";
import {
  createPendingOrder,
  generateOrderNumber,
  markOrderPaid,
  ORDER_NUMBER_PATTERN,
  orderItemsFromCart,
  orderTotals,
  shippingCentsFor,
  updateOrderFulfillment,
} from "./index";

// Catalog: a multivitamin (id 1) with 1/2/3-bottle tiers whose 2+ tiers give a
// shaker (id 10), and a pill organizer (id 11) offered as the multivitamin's bump.
const MULTI = 1;
const SHAKER = 10;
const ORGANIZER = 11;

const catalogProducts: CatalogProduct[] = [
  {
    id: MULTI,
    title: "Multivitamin",
    slug: "multivitamin",
    status: "active",
    stock: 20,
    regularPriceCents: 4999,
    images: [],
    tiers: [
      { bottles: 1, bundlePriceCents: 3999, gift: null },
      { bottles: 2, bundlePriceCents: 6999, gift: { giftProductId: SHAKER, substituteProductId: null, giftQty: null } },
      { bottles: 3, bundlePriceCents: 9497, gift: { giftProductId: SHAKER, substituteProductId: null, giftQty: null } },
    ],
    bump: { bumpProductId: ORGANIZER, bumpPriceCents: 499, headline: "Add an organizer" },
  },
  { id: SHAKER, title: "Shaker", slug: "shaker", status: "unlisted", stock: 10, regularPriceCents: 1299, images: [], tiers: [] },
  { id: ORGANIZER, title: "Organizer", slug: "organizer", status: "unlisted", stock: 5, regularPriceCents: 999, images: [], tiers: [] },
];
const catalog = new Map(catalogProducts.map((p) => [p.id, p]));

/** 3 multivitamins (bundle 94.97, 2 free shakers) + the accepted organizer bump */
function pricedCart(quantity = 3, bump = true): PricedCart {
  return priceCart([{ id: 100, productId: MULTI, quantity }], catalog, {
    offerActive: true,
    maxQuantityPerLine: null,
    acceptedBump: bump ? { id: 101, productId: ORGANIZER } : null,
  });
}

const details: CheckoutDetails = {
  email: "jane@example.com",
  phone: "2125550100",
  name: "Jane Doe",
  line1: "1 Main St",
  line2: "",
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  shippingMethodId: 1,
};
const standard = { id: 1, name: "Standard", deliveryText: "3-5 days", priceCents: 595, freeOverCents: 7500 };

describe("order snapshot", () => {
  it("copies paid lines, the bump and one gift line per paid line", () => {
    const items = orderItemsFromCart(pricedCart());
    expect(items).toEqual([
      expect.objectContaining({ productId: MULTI, quantity: 3, lineTotalCents: 9497, unitPriceCents: 3166, isGift: false }),
      expect.objectContaining({ productId: ORGANIZER, quantity: 1, lineTotalCents: 499, isBump: true }),
      expect.objectContaining({ productId: SHAKER, quantity: 2, lineTotalCents: 0, isGift: true, parentProductId: MULTI }),
    ]);
  });

  it("charges shipping unless the subtotal reaches the free-over amount", () => {
    expect(shippingCentsFor(standard, 7499)).toBe(595);
    expect(shippingCentsFor(standard, 7500)).toBe(0);
    expect(shippingCentsFor({ priceCents: 595, freeOverCents: null }, 100000)).toBe(595);
    expect(orderTotals(pricedCart(1, false), standard)).toEqual({ subtotalCents: 3999, shippingCents: 595, totalCents: 4594 });
    expect(orderTotals(pricedCart(), standard)).toEqual({ subtotalCents: 9996, shippingCents: 0, totalCents: 9996 });
  });

  it("generates random order numbers in the public format", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
    for (const number of numbers) expect(number).toMatch(ORDER_NUMBER_PATTERN);
  });
});

describe("orders in the database", () => {
  let db: Db;

  beforeEach(async () => {
    ({ db } = createTestDb());
    await db.insert(products).values(
      catalogProducts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, regularPriceCents: p.regularPriceCents, stock: p.stock, status: p.status })),
    );
    await db.insert(shippingMethods).values({ id: 1, name: "Standard", priceCents: 595, freeOverCents: 7500 });
    await db.insert(carts).values({ id: "cart-1" });
    await db.insert(cartItems).values({ cartId: "cart-1", productId: MULTI, quantity: 3 });
  });

  const stock = async (id: number) => (await db.select({ stock: products.stock }).from(products).where(eq(products.id, id)))[0].stock;
  const place = (paypalOrderId = "PAYPAL-1") =>
    createPendingOrder(db, { details, cart: pricedCart(), method: standard, paypalOrderId, cartId: "cart-1" });

  it("saves a pending order with a price snapshot, gifts pointing at their paid line", async () => {
    const { id, orderNumber } = await place();
    expect(orderNumber).toMatch(ORDER_NUMBER_PATTERN);
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    expect(order).toMatchObject({ status: "pending", totalCents: 9996, shippingCents: 0, email: "jane@example.com", phone: "2125550100" });

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id);
    expect(items).toHaveLength(3);
    const paid = items.find((item) => item.productId === MULTI && !item.isGift)!;
    const gift = items.find((item) => item.isGift)!;
    expect(gift.parentItemId).toBe(paid.id);
    expect(items.find((item) => item.isBump)).toMatchObject({ productId: ORGANIZER, unitPriceCents: 499 });
    // Pending orders don't touch stock
    expect(await stock(MULTI)).toBe(20);
  });

  it("keeps the snapshot when the product's price changes later", async () => {
    const { id } = await place();
    await db.update(products).set({ regularPriceCents: 1 }).where(eq(products.id, MULTI));
    const [paid] = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    expect(paid.lineTotalCents).toBe(9497);
  });

  it("refuses a second order for the same PayPal order", async () => {
    await place("PAYPAL-1");
    await expect(place("PAYPAL-1")).rejects.toThrow();
  });

  it("marks paid once: stock (paid, gift and bump bottles) is reduced once and the cart is emptied", async () => {
    const { id } = await place();
    const first = await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    expect(first).toMatchObject({ result: "paid", orderId: id });
    expect([await stock(MULTI), await stock(SHAKER), await stock(ORGANIZER)]).toEqual([17, 8, 4]);
    expect(await db.select().from(cartItems).where(eq(cartItems.cartId, "cart-1"))).toEqual([]);

    // The webhook arrives again (or races the capture response)
    const again = await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    expect(again).toMatchObject({ result: "already_processed", status: "paid" });
    expect([await stock(MULTI), await stock(SHAKER), await stock(ORGANIZER)]).toEqual([17, 8, 4]);

    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    expect(order.status).toBe("paid");
    expect(order.paypalCaptureId).toBe("CAPTURE-1");
    expect(order.paidAt).toBeInstanceOf(Date);
  });

  it("doesn't empty a new cart when a duplicate webhook arrives later", async () => {
    await place();
    await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    await db.insert(cartItems).values({ cartId: "cart-1", productId: MULTI, quantity: 1 });
    await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    expect(await db.select().from(cartItems).where(eq(cartItems.cartId, "cart-1"))).toHaveLength(1);
  });

  it("never takes stock below zero", async () => {
    await place();
    await db.update(products).set({ stock: 1 }).where(eq(products.id, MULTI));
    await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    expect(await stock(MULTI)).toBe(0);
  });

  it("reports an unknown PayPal order", async () => {
    expect(await markOrderPaid(db, { paypalOrderId: "NOPE", captureId: "X" })).toEqual({ result: "not_found" });
  });

  it("lets the admin ship and refund paid orders only", async () => {
    const { id } = await place();
    expect(await updateOrderFulfillment(db, id, { status: "shipped", trackingNumber: "1Z999" })).toEqual({ ok: false, reason: "not_paid" });

    await markOrderPaid(db, { paypalOrderId: "PAYPAL-1", captureId: "CAPTURE-1" });
    const shippedAt = new Date("2026-10-20T10:00:00Z");
    expect(await updateOrderFulfillment(db, id, { status: "shipped", trackingNumber: "1Z999" }, shippedAt)).toEqual({ ok: true });
    await updateOrderFulfillment(db, id, { status: "refunded", trackingNumber: "1Z999" }, new Date("2026-10-25T10:00:00Z"));
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    expect(order).toMatchObject({ status: "refunded", trackingNumber: "1Z999" });
    expect(order.shippedAt?.toISOString()).toBe(shippedAt.toISOString());
    expect(order.refundedAt).toBeInstanceOf(Date);
    // Marking refunded doesn't put bottles back (refunds are handled in PayPal)
    expect(await stock(MULTI)).toBe(17);
  });
});
