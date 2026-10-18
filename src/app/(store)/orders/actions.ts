"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { findOrderForCustomer, ORDER_NUMBER_PATTERN } from "@/lib/orders";
import { grantOrderAccess } from "@/lib/orders/access";
import { pickFields } from "@/lib/validation/form";

export type LookupState = { error: string | null };

const lookupSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  // People type order numbers in lowercase or without the dash
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => value.replace(/^DX-?/, "DX-"))
    .pipe(z.string().regex(ORDER_NUMBER_PATTERN)),
});

const notFound = "We couldn't find an order with that email and order number. Check both and try again.";

/** Order lookup: the email must match the order's. Opens the order page in this browser. */
export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const parsed = lookupSchema.safeParse(pickFields(formData, ["email", "orderNumber"]));
  if (!parsed.success) return { error: notFound };
  const order = await findOrderForCustomer(getDb(), parsed.data.orderNumber, parsed.data.email);
  if (!order) return { error: notFound };
  await grantOrderAccess(order.orderNumber);
  redirect(`/orders/${order.orderNumber}`);
}
