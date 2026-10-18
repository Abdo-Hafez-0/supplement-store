import { z } from "zod";
import { US_STATES } from "./us-states";

export { US_STATES };

// Checkout requests carry the customer's details and a shipping method id only.
// Prices come from the server cart (CLAUDE.md rule 2).

const stateCodes = US_STATES.map(([code]) => code) as [string, ...string[]];

const required = (label: string, max: number) =>
  z.string(`Enter your ${label}`).trim().min(1, `Enter your ${label}`).max(max, `${label} is too long`);

/** Digits only, without a leading US country code: "(555) 010-0000" -> "5550100000" */
export function normalizeUsPhone(input: string): string | null {
  if (!/^[\d\s().+-]+$/.test(input)) return null;
  const digits = input.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? national : null;
}

export const checkoutDetailsSchema = z.strictObject({
  email: z
    .string("Enter your email")
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address").max(254, "Email is too long")),
  phone: z
    .string("Enter your phone number")
    .trim()
    .transform((value, ctx) => {
      const phone = normalizeUsPhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Enter a 10-digit US phone number" });
        return z.NEVER;
      }
      return phone;
    }),
  name: required("full name", 100),
  line1: required("street address", 200),
  line2: z.string().trim().max(200, "Too long").default(""),
  city: required("city", 100),
  state: z.enum(stateCodes, "Choose your state"),
  postalCode: z
    .string("Enter your ZIP code")
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
  shippingMethodId: z.number("Choose a shipping method").int().positive("Choose a shipping method"),
});

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;
export type CheckoutField = keyof CheckoutDetails;

/** Formats a stored 10-digit phone for display: "(555) 010-0000" */
export function formatUsPhone(phone: string) {
  return /^\d{10}$/.test(phone) ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}` : phone;
}
