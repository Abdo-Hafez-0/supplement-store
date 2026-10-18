"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/form-state";
import { invalid } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { adminOrderStatuses, updateOrderFulfillment } from "@/lib/orders";
import { pickFields } from "@/lib/validation/form";

const orderId = z.number().int().positive();

const fulfillmentSchema = z.strictObject({
  status: z.enum(adminOrderStatuses, "Choose a status"),
  trackingNumber: z
    .string()
    .trim()
    .max(100, "Tracking number is too long")
    .regex(/^[A-Za-z0-9 -]*$/, "Use letters, numbers, spaces and dashes only")
    .default("")
    .transform((value) => value || null),
});

export async function saveFulfillment(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const target = orderId.parse(id);
  const parsed = fulfillmentSchema.safeParse(pickFields(formData, ["status", "trackingNumber"]));
  if (!parsed.success) return invalid(parsed.error);

  const result = await updateOrderFulfillment(getDb(), target, parsed.data);
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "not_found" ? "This order no longer exists." : "Only paid orders can be updated.",
    };
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${target}`);
  return { status: "success", message: "Saved." };
}
