"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/form-state";
import { invalid } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { shippingMethods } from "@/lib/db/schema";
import { shippingMethodFormFields, shippingMethodFormSchema } from "@/lib/validation/admin";
import { pickFields } from "@/lib/validation/form";

const methodId = z.number().int().positive();

export async function saveShippingMethod(
  id: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const target = id === null ? null : methodId.parse(id);
  const parsed = shippingMethodFormSchema.safeParse(pickFields(formData, shippingMethodFormFields));
  if (!parsed.success) return invalid(parsed.error);

  const { price, freeOver, ...rest } = parsed.data;
  const values = { ...rest, priceCents: price, freeOverCents: freeOver };
  const db = getDb();
  if (target === null) {
    await db.insert(shippingMethods).values(values);
  } else {
    const updated = await db
      .update(shippingMethods)
      .set(values)
      .where(eq(shippingMethods.id, target))
      .returning({ id: shippingMethods.id });
    if (!updated.length) return { status: "error", message: "This shipping method no longer exists." };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: target === null ? "Shipping method added." : "Saved." };
}

export async function deleteShippingMethod(id: number): Promise<FormState> {
  await requireAdmin();
  // Past orders keep the method's name as a snapshot; their link is set to null.
  await getDb().delete(shippingMethods).where(eq(shippingMethods.id, methodId.parse(id)));
  revalidatePath("/", "layout");
  return { status: "success", message: "Shipping method deleted." };
}
