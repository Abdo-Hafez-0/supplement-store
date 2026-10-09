import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

// Rules (see CLAUDE.md): all money columns are integer cents (`*_cents`).
// Timestamps are unix seconds, exposed as Date by Drizzle.

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** Every sellable item, including gift products (a gift bought alone pays full price). */
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    regularPriceCents: integer("regular_price_cents").notNull(),
    compareAtPriceCents: integer("compare_at_price_cents"),
    stock: integer("stock").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    /** Shown in the storefront listing. Gift-only products can be hidden. */
    isListed: integer("is_listed", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    /** R2 object keys */
    imageKey: text("image_key"),
    videoKey: text("video_key"),
    bannerText: text("banner_text"),
    ...timestamps,
  },
  (t) => [uniqueIndex("products_slug_unique").on(t.slug)],
);

/** Quantity tiers ("buy 2 bottles at $X each"). Price is per bottle, so any quantity prices exactly. */
export const productTiers = sqliteTable(
  "product_tiers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    bottles: integer("bottles").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    label: text("label"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("product_tiers_product_bottles_unique").on(t.productId, t.bottles)],
);

/** The gift attached to a tier, with a substitute used when the gift is out of stock. */
export const tierGifts = sqliteTable(
  "tier_gifts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tierId: integer("tier_id")
      .notNull()
      .references(() => productTiers.id, { onDelete: "cascade" }),
    giftProductId: integer("gift_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    substituteProductId: integer("substitute_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    /** null = default of (bottles - 1) */
    quantityOverride: integer("quantity_override"),
    giftText: text("gift_text"),
    ...timestamps,
  },
  (t) => [uniqueIndex("tier_gifts_tier_unique").on(t.tierId)],
);

/** Checkout add-on offer. */
export const orderBumps = sqliteTable("order_bumps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const reviewImages = sqliteTable(
  "review_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageKey: text("image_key").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("review_images_product_idx").on(t.productId)],
);

export const shippingMethods = sqliteTable("shipping_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  /** Free when the subtotal reaches this amount; null = never */
  freeOverCents: integer("free_over_cents"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Key/value store for banner texts and other admin settings. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/** Guest cart, identified by a random id stored in a cookie. */
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  ...timestamps,
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
    /** Gift lines point at the line that earned them and are removed with it. */
    parentItemId: integer("parent_item_id").references((): AnySQLiteColumn => cartItems.id, {
      onDelete: "cascade",
    }),
    ...timestamps,
  },
  (t) => [
    index("cart_items_cart_idx").on(t.cartId),
    index("cart_items_parent_idx").on(t.parentItemId),
  ],
);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orderStatuses = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Idempotency key for payments: one order per PayPal order. */
    paypalOrderId: text("paypal_order_id").notNull(),
    paypalCaptureId: text("paypal_capture_id"),
    status: text("status", { enum: orderStatuses }).notNull().default("pending"),
    email: text("email").notNull(),
    phone: text("phone"),
    shippingName: text("shipping_name").notNull(),
    shippingLine1: text("shipping_line1").notNull(),
    shippingLine2: text("shipping_line2"),
    shippingCity: text("shipping_city").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingCountry: text("shipping_country").notNull().default("US"),
    shippingMethodId: integer("shipping_method_id").references(() => shippingMethods.id, {
      onDelete: "set null",
    }),
    /** Snapshot so later edits to the method don't change the order */
    shippingMethodName: text("shipping_method_name").notNull(),
    currency: text("currency").notNull().default("USD"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    /** Cart the order came from; plain text (no FK) so carts can be purged. */
    cartId: text("cart_id"),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_paypal_order_id_unique").on(t.paypalOrderId),
    index("orders_status_idx").on(t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Kept nullable so deleting a product never deletes order history. */
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    // Price snapshot at purchase time
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
    isBump: integer("is_bump", { mode: "boolean" }).notNull().default(false),
    parentItemId: integer("parent_item_id").references((): AnySQLiteColumn => orderItems.id, {
      onDelete: "cascade",
    }),
    ...timestamps,
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// Better Auth tables (generated by `npm run auth:generate`)
export * from "./auth-schema";
