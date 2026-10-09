import { z } from "zod";
import { parseDollarsToCents } from "@/lib/money";
import { productStatuses } from "@/lib/db/schema";

// Shared field types. Form values arrive as strings; these parse them strictly
// (no silent coercion of bad input) into the shapes the database expects.

/** "39.99" -> 3999. Rejects anything that is not a plain dollar amount. */
export const dollars = z.string().transform((value, ctx) => {
  const cents = parseDollarsToCents(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "Enter an amount like 39.99" });
    return z.NEVER;
  }
  return cents;
});

/** Empty -> null, otherwise dollars */
export const optionalDollars = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined || value.trim() === "") return null;
    const cents = parseDollarsToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 39.99, or leave empty" });
      return z.NEVER;
    }
    return cents;
  });

/** Whole number from a text input */
export const intString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^-?\d+$/, "Enter a whole number")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

/** Empty -> null, otherwise a whole number */
export const optionalIntString = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === "" ? undefined : value))
    .pipe(intString(min, max).optional())
    .transform((value) => value ?? null);

/** HTML checkbox: "on" when ticked, missing when not */
export const checkbox = z
  .literal("on")
  .optional()
  .transform((value) => value === "on");

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1, "Required");

/** R2 object key produced by the upload route */
export const mediaKey = (folder: MediaFolder) =>
  z.string().regex(new RegExp(`^${folder}/[a-z0-9-]{36}\.(jpg|png|webp|mp4)$`), "Invalid file");

export const mediaFolders = ["products", "reviews", "video"] as const;
export type MediaFolder = (typeof mediaFolders)[number];

// --- Products --------------------------------------------------------------

export const MAX_PRODUCT_IMAGES = 10;
export const MAX_REVIEW_IMAGES = 15;

export const productFormSchema = z.strictObject({
  title: requiredText(120),
  slug: z
    .string()
    .trim()
    .min(1, "Required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  shortDescription: text(300).default(""),
  description: text(10_000).default(""),
  regularPrice: dollars,
  stock: intString(0, 1_000_000),
  status: z.enum(productStatuses),
  isFeatured: checkbox,
  sortOrder: intString(-9999, 9999),
  images: z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid image list" });
        return z.NEVER;
      }
    })
    .pipe(z.array(mediaKey("products")).max(MAX_PRODUCT_IMAGES)),
});
export const productFormFields = Object.keys(productFormSchema.shape) as (keyof typeof productFormSchema.shape)[];

// --- Tiers and gifts (sent as JSON by the tier editor) ----------------------

const id = z.number().int().positive();

export const tierInputSchema = z.strictObject({
  bottles: z.number().int().min(1).max(99),
  bundlePrice: dollars,
  badgeLabel: text(40).transform((v) => v || null),
  isDefault: z.boolean(),
  gift: z
    .strictObject({
      giftProductId: id,
      substituteProductId: id.nullable(),
      /** null = bottles - 1 */
      giftQty: z.number().int().min(0).max(99).nullable(),
    })
    .nullable(),
});

export const tiersSchema = z
  .array(tierInputSchema)
  .max(10)
  .superRefine((tiers, ctx) => {
    const seen = new Set<number>();
    tiers.forEach((tier, index) => {
      if (seen.has(tier.bottles)) {
        ctx.addIssue({ code: "custom", path: [index, "bottles"], message: "Each tier needs a different bottle count" });
      }
      seen.add(tier.bottles);
      if (tier.gift && tier.gift.substituteProductId === tier.gift.giftProductId) {
        ctx.addIssue({ code: "custom", path: [index, "gift"], message: "The substitute must be a different product" });
      }
    });
    if (tiers.filter((tier) => tier.isDefault).length > 1) {
      ctx.addIssue({ code: "custom", message: "Only one tier can be preselected" });
    }
  });
export type TierInput = z.input<typeof tierInputSchema>;

// --- Order bump -------------------------------------------------------------

export const orderBumpFormSchema = z.strictObject({
  bumpProductId: intString(1, Number.MAX_SAFE_INTEGER),
  bumpPrice: dollars,
  headline: requiredText(200),
});
export const orderBumpFormFields = Object.keys(orderBumpFormSchema.shape) as (keyof typeof orderBumpFormSchema.shape)[];

// --- Review images ----------------------------------------------------------

export const reviewImageAddSchema = z.strictObject({
  fileKey: mediaKey("reviews"),
  alt: text(200).default(""),
});

// --- Shipping methods -------------------------------------------------------

export const shippingMethodFormSchema = z.strictObject({
  name: requiredText(80),
  deliveryText: text(120).default(""),
  price: dollars,
  freeOver: optionalDollars,
  isActive: checkbox,
  sortOrder: intString(-9999, 9999),
});
export const shippingMethodFormFields = Object.keys(shippingMethodFormSchema.shape) as (keyof typeof shippingMethodFormSchema.shape)[];
