"use server";

import { and, count, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/form-state";
import { invalid, isUniqueViolation } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { findProductUsage, productIdsExist } from "@/lib/db/queries/admin-products";
import { orderBumps, products, productTiers, reviewImages, tierGifts } from "@/lib/db/schema";
import { deleteMedia } from "@/lib/media";
import {
  MAX_REVIEW_IMAGES,
  orderBumpFormFields,
  orderBumpFormSchema,
  productFormFields,
  productFormSchema,
  reviewImageAddSchema,
  tiersSchema,
} from "@/lib/validation/admin";
import { pickFields } from "@/lib/validation/form";

// Every action re-checks the admin session (server actions are public endpoints)
// and validates its input with Zod. Ids bound from the page are validated too.

const productId = z.number().int().positive();

function refresh() {
  // Admin and storefront pages both read these tables.
  revalidatePath("/", "layout");
}

// --- Product details --------------------------------------------------------

export async function saveProduct(
  id: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const existingId = id === null ? null : productId.parse(id);
  const parsed = productFormSchema.safeParse(pickFields(formData, productFormFields));
  if (!parsed.success) return invalid(parsed.error);

  const { regularPrice, ...fields } = parsed.data;
  const values = { ...fields, regularPriceCents: regularPrice };
  const db = getDb();

  let savedId: number;
  try {
    if (existingId === null) {
      const [row] = await db.insert(products).values(values).returning({ id: products.id });
      savedId = row.id;
    } else {
      const [before] = await db
        .select({ images: products.images })
        .from(products)
        .where(eq(products.id, existingId));
      if (!before) return { status: "error", message: "This product no longer exists." };
      await db.update(products).set(values).where(eq(products.id, existingId));
      await deleteMedia(before.images.filter((key) => !values.images.includes(key)));
      savedId = existingId;
    }
  } catch (error) {
    if (isUniqueViolation(error, "slug")) {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: "Another product already uses this URL slug" },
      };
    }
    throw error;
  }

  refresh();
  if (existingId === null) redirect(`/admin/products/${savedId}?created=1`);
  return { status: "success", message: "Product saved." };
}

export async function deleteProduct(id: number): Promise<FormState> {
  await requireAdmin();
  const target = productId.parse(id);
  const db = getDb();

  const usage = await findProductUsage(db, target);
  const uses = [
    ...usage.asGift.map((title) => `a gift or substitute for "${title}"`),
    ...usage.asBump.map((title) => `the order bump for "${title}"`),
  ];
  if (uses.length) {
    return {
      status: "error",
      message: `This product is used as ${uses.join(", ")}. Change those first, or set it to Draft instead.`,
    };
  }

  const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, target));
  if (!product) redirect("/admin/products");
  const reviews = await db
    .select({ fileKey: reviewImages.fileKey })
    .from(reviewImages)
    .where(eq(reviewImages.productId, target));

  // Tiers, gifts, bump and review images cascade; past orders keep their snapshots.
  await db.delete(products).where(eq(products.id, target));
  await deleteMedia([...product.images, ...reviews.map((row) => row.fileKey)]);
  refresh();
  redirect("/admin/products");
}

// --- Tiers and gifts --------------------------------------------------------

const tierFieldMessages: Record<string, string> = {
  bottles: "Bottles must be a whole number from 1 to 99.",
  bundlePrice: "Enter the bundle price like 99.00.",
  badgeLabel: "The badge can be up to 40 characters.",
  giftProductId: "Choose a gift product.",
  substituteProductId: "Choose a valid substitute, or None.",
  giftQty: "Gift quantity must be a whole number from 0 to 99, or empty.",
};

function describeTierIssue(issue: z.core.$ZodIssue | undefined) {
  if (!issue) return "Check the tiers.";
  const [index, ...rest] = issue.path;
  const prefix = typeof index === "number" ? `Tier ${index + 1}: ` : "";
  const field = rest.findLast((part): part is string => typeof part === "string" && part in tierFieldMessages);
  return prefix + (issue.code === "custom" || !field ? issue.message : tierFieldMessages[field]);
}

export async function saveTiers(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const target = productId.parse(id);
  const { tiers: raw } = pickFields(formData, ["tiers"]);

  let json: unknown;
  try {
    json = JSON.parse(raw ?? "");
  } catch {
    return { status: "error", message: "Could not read the tiers. Reload the page and try again." };
  }
  const parsed = tiersSchema.safeParse(json);
  if (!parsed.success) return { status: "error", message: describeTierIssue(parsed.error.issues[0]) };
  const tiers = parsed.data;

  const db = getDb();
  const giftIds = tiers.flatMap((tier) =>
    tier.gift ? [tier.gift.giftProductId, ...(tier.gift.substituteProductId ? [tier.gift.substituteProductId] : [])] : [],
  );
  if (!(await productIdsExist(db, [target, ...giftIds]))) {
    return { status: "error", message: "A selected gift product no longer exists. Reload the page." };
  }

  // Replace the whole set in one atomic batch. Gift rows find their new tier by
  // (product_id, bottles), which is unique, so no ids are needed between statements.
  const statements: BatchItem<"sqlite">[] = [db.delete(productTiers).where(eq(productTiers.productId, target))];
  tiers.forEach((tier, index) => {
    statements.push(
      db.insert(productTiers).values({
        productId: target,
        bottles: tier.bottles,
        bundlePriceCents: tier.bundlePrice,
        badgeLabel: tier.badgeLabel,
        isDefault: tier.isDefault,
        sortOrder: index,
      }),
    );
    if (tier.gift) {
      statements.push(
        db.insert(tierGifts).values({
          tierId: sql`(select ${productTiers.id} from ${productTiers} where ${productTiers.productId} = ${target} and ${productTiers.bottles} = ${tier.bottles})`,
          giftProductId: tier.gift.giftProductId,
          substituteProductId: tier.gift.substituteProductId,
          giftQty: tier.gift.giftQty,
        }),
      );
    }
  });
  const [first, ...rest] = statements;
  await db.batch([first, ...rest]);

  refresh();
  return { status: "success", message: tiers.length ? "Tiers saved." : "Tiers removed. The product sells at its regular price." };
}

// --- Order bump -------------------------------------------------------------

export async function saveOrderBump(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const target = productId.parse(id);
  const parsed = orderBumpFormSchema.safeParse(pickFields(formData, orderBumpFormFields));
  if (!parsed.success) return invalid(parsed.error);
  const { bumpProductId, bumpPrice, headline } = parsed.data;

  if (bumpProductId === target) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { bumpProductId: "Pick a different product than this one" },
    };
  }
  const db = getDb();
  if (!(await productIdsExist(db, [target, bumpProductId]))) {
    return { status: "error", message: "That product no longer exists. Reload the page." };
  }

  const values = { bumpProductId, bumpPriceCents: bumpPrice, headline };
  await db
    .insert(orderBumps)
    .values({ productId: target, ...values })
    .onConflictDoUpdate({ target: orderBumps.productId, set: { ...values, updatedAt: new Date() } });
  refresh();
  return { status: "success", message: "Order bump saved." };
}

export async function deleteOrderBump(id: number): Promise<FormState> {
  await requireAdmin();
  await getDb().delete(orderBumps).where(eq(orderBumps.productId, productId.parse(id)));
  refresh();
  return { status: "success", message: "Order bump removed." };
}

// --- Review images ----------------------------------------------------------

export async function addReviewImage(id: number, input: { fileKey: string; alt: string }): Promise<FormState> {
  await requireAdmin();
  const target = productId.parse(id);
  const parsed = reviewImageAddSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error, "Invalid image");

  const db = getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(reviewImages)
    .where(eq(reviewImages.productId, target));
  if (value >= MAX_REVIEW_IMAGES) {
    await deleteMedia([parsed.data.fileKey]);
    return { status: "error", message: `A product can have up to ${MAX_REVIEW_IMAGES} review images.` };
  }
  await db.insert(reviewImages).values({ productId: target, ...parsed.data, sortOrder: value });
  refresh();
  return { status: "success", message: "Review image added." };
}

const reviewImageId = z.number().int().positive();

export async function updateReviewImageAlt(id: number, alt: string): Promise<FormState> {
  await requireAdmin();
  const parsed = z.string().trim().max(200).safeParse(alt);
  if (!parsed.success) return { status: "error", message: "Description is too long (200 characters max)." };
  await getDb()
    .update(reviewImages)
    .set({ alt: parsed.data })
    .where(eq(reviewImages.id, reviewImageId.parse(id)));
  refresh();
  return { status: "success", message: "Saved." };
}

export async function reorderReviewImages(id: number, orderedIds: number[]): Promise<FormState> {
  await requireAdmin();
  const target = productId.parse(id);
  const ids = z.array(reviewImageId).max(MAX_REVIEW_IMAGES).parse(orderedIds);
  if (!ids.length) return { status: "idle" };
  const db = getDb();
  const updates = ids.map((imageId, index) =>
    db
      .update(reviewImages)
      .set({ sortOrder: index })
      .where(and(eq(reviewImages.id, imageId), eq(reviewImages.productId, target))),
  );
  const [first, ...rest] = updates;
  await db.batch([first, ...rest]);
  refresh();
  return { status: "success", message: "Order saved." };
}

export async function deleteReviewImage(id: number): Promise<FormState> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .delete(reviewImages)
    .where(eq(reviewImages.id, reviewImageId.parse(id)))
    .returning({ fileKey: reviewImages.fileKey });
  await deleteMedia([row?.fileKey]);
  refresh();
  return { status: "success", message: "Review image removed." };
}
