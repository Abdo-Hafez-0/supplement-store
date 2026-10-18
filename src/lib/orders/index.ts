// Orders: created as "pending" at checkout, then marked paid exactly once.
//
// Rule 5 (CLAUDE.md): orders are keyed by PayPal order ID, and stock is reduced in
// the same write that marks the order paid. markOrderPaid() runs one D1 batch (a
// transaction) whose every statement is guarded by "this order is still pending",
// so a webhook that arrives twice, or a webhook racing the capture response, can't
// reduce stock twice.

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { Db } from "@/lib/db/client";
import { cartItems, orderItems, orders, products, type OrderStatus } from "@/lib/db/schema";
import type { PricedCart } from "@/lib/pricing";
import type { CheckoutDetails } from "@/lib/validation/checkout";
import { generateOrderNumber, orderItemsFromCart, orderTotals, stockToTake, type ShippingOption } from "./snapshot";

export * from "./snapshot";

export type PendingOrderInput = {
  details: CheckoutDetails;
  cart: PricedCart;
  method: ShippingOption;
  paypalOrderId: string;
  cartId: string | null;
};

/** Saves the order and its price snapshot in one atomic batch. Returns its id and number. */
export async function createPendingOrder(db: Db, input: PendingOrderInput, attempt = 0): Promise<{ id: number; orderNumber: string }> {
  const { details, cart, method } = input;
  const orderNumber = generateOrderNumber();
  const totals = orderTotals(cart, method);
  const items = orderItemsFromCart(cart);
  // Items find their order (and gifts their parent line) by subquery, so the whole
  // order is written in one batch without a round trip for the new ids.
  const orderId = sql`(select id from ${orders} where ${orders.orderNumber} = ${orderNumber})`;
  const row = (item: (typeof items)[number]) => ({
    orderId,
    productId: item.productId,
    productName: item.productName,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
    isGift: item.isGift,
    isBump: item.isBump,
    parentItemId:
      item.parentProductId === null
        ? null
        : sql`(select id from ${orderItems} where ${orderItems.orderId} = ${orderId} and ${orderItems.productId} = ${item.parentProductId} and ${orderItems.isGift} = 0 and ${orderItems.isBump} = 0)`,
  });
  const nonGifts = items.filter((item) => !item.isGift).map(row);
  const gifts = items.filter((item) => item.isGift).map(row);

  const statements: BatchItem<"sqlite">[] = [
    db.insert(orders).values({
      orderNumber,
      paypalOrderId: input.paypalOrderId,
      status: "pending",
      email: details.email,
      phone: details.phone,
      shippingName: details.name,
      shippingLine1: details.line1,
      shippingLine2: details.line2 || null,
      shippingCity: details.city,
      shippingState: details.state,
      shippingPostalCode: details.postalCode,
      shippingCountry: "US",
      shippingMethodId: method.id,
      shippingMethodName: method.name,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      totalCents: totals.totalCents,
      cartId: input.cartId,
    }),
  ];
  if (nonGifts.length) statements.push(db.insert(orderItems).values(nonGifts));
  if (gifts.length) statements.push(db.insert(orderItems).values(gifts));

  try {
    const [first, ...rest] = statements;
    await db.batch([first, ...rest]);
  } catch (error) {
    // A random order number collided (very unlikely): try again with a new one
    if (attempt < 2 && String(error instanceof Error ? (error.cause ?? error.message) : error).includes("order_number")) {
      return createPendingOrder(db, input, attempt + 1);
    }
    throw error;
  }
  const [created] = await db.select({ id: orders.id }).from(orders).where(eq(orders.orderNumber, orderNumber));
  return { id: created.id, orderNumber };
}

export type MarkPaidResult =
  | { result: "paid"; orderId: number; orderNumber: string }
  | { result: "already_processed"; orderId: number; orderNumber: string; status: OrderStatus }
  | { result: "not_found" };

/**
 * Marks the order for this PayPal order paid, takes its bottles from stock and empties
 * the cart it came from, all in one transaction. Safe to call any number of times.
 */
export async function markOrderPaid(
  db: Db,
  { paypalOrderId, captureId, paidAt = new Date() }: { paypalOrderId: string; captureId: string; paidAt?: Date },
): Promise<MarkPaidResult> {
  const [order] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, cartId: orders.cartId })
    .from(orders)
    .where(eq(orders.paypalOrderId, paypalOrderId));
  if (!order) return { result: "not_found" };
  if (order.status !== "pending") {
    return { result: "already_processed", orderId: order.id, orderNumber: order.orderNumber, status: order.status };
  }

  const items = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const stillPending = sql`exists (select 1 from ${orders} where ${orders.id} = ${order.id} and ${orders.status} = 'pending')`;

  const statements: BatchItem<"sqlite">[] = [];
  const toTake = stockToTake(items.filter((item): item is { productId: number; quantity: number } => item.productId !== null));
  for (const [productId, quantity] of toTake) {
    statements.push(
      db
        .update(products)
        // Never below zero; an oversell (two shoppers paying for the last bottles at once) shows as 0 stock
        .set({ stock: sql`max(0, ${products.stock} - ${quantity})` })
        .where(and(eq(products.id, productId), stillPending)),
    );
  }
  if (order.cartId) statements.push(db.delete(cartItems).where(and(eq(cartItems.cartId, order.cartId), stillPending)));
  const markPaid = db
    .update(orders)
    .set({ status: "paid", paypalCaptureId: captureId, paidAt })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  statements.push(markPaid);

  const [first, ...rest] = statements;
  const results = await db.batch([first, ...rest]);
  const updated = results.at(-1) as { id: number }[];
  if (updated.length) return { result: "paid", orderId: order.id, orderNumber: order.orderNumber };

  const [now] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, order.id));
  return { result: "already_processed", orderId: order.id, orderNumber: order.orderNumber, status: now.status };
}

/** Statuses the admin can set, and only on orders that have been paid. */
export const adminOrderStatuses = ["paid", "shipped", "refunded"] as const satisfies readonly OrderStatus[];
export type AdminOrderStatus = (typeof adminOrderStatuses)[number];

export async function updateOrderFulfillment(
  db: Db,
  orderId: number,
  { status, trackingNumber }: { status: AdminOrderStatus; trackingNumber: string | null },
  now = new Date(),
) {
  const [current] = await db
    .select({ status: orders.status, shippedAt: orders.shippedAt, refundedAt: orders.refundedAt })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!current) return { ok: false as const, reason: "not_found" as const };
  if (!(adminOrderStatuses as readonly string[]).includes(current.status)) {
    return { ok: false as const, reason: "not_paid" as const };
  }
  await db
    .update(orders)
    .set({
      status,
      trackingNumber,
      shippedAt: status === "shipped" ? (current.shippedAt ?? now) : current.shippedAt,
      refundedAt: status === "refunded" ? (current.refundedAt ?? now) : current.refundedAt,
    })
    .where(eq(orders.id, orderId));
  return { ok: true as const };
}

// --- Reads -------------------------------------------------------------------

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

async function withItems(db: Db, order: OrderRow | undefined): Promise<OrderWithItems | null> {
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.id);
  return { ...order, items };
}

export async function getOrderById(db: Db, id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return withItems(db, order);
}

export async function getOrderByNumber(db: Db, orderNumber: string) {
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  return withItems(db, order);
}

/** For the customer lookup: both must match. */
export async function findOrderForCustomer(db: Db, orderNumber: string, email: string) {
  const [order] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.email, email)));
  return order ?? null;
}

export const ORDERS_PAGE_SIZE = 50;

/** Newest first. "paid" view = every order that was paid (paid, shipped, refunded). */
export async function listOrders(db: Db, view: "paid" | "to_ship" | "pending" | "all", page: number) {
  const where =
    view === "paid"
      ? inArray(orders.status, ["paid", "shipped", "refunded"])
      : view === "to_ship"
        ? eq(orders.status, "paid")
        : view === "pending"
          ? inArray(orders.status, ["pending", "cancelled"])
          : undefined;
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      email: orders.email,
      shippingName: orders.shippingName,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(ORDERS_PAGE_SIZE + 1)
    .offset((page - 1) * ORDERS_PAGE_SIZE);
  return { rows: rows.slice(0, ORDERS_PAGE_SIZE), hasMore: rows.length > ORDERS_PAGE_SIZE };
}
