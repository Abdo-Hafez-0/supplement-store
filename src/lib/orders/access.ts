import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { hmacSign, safeEqual } from "@/lib/signing";
import { ORDER_NUMBER_PATTERN } from "./snapshot";

// A customer's order page shows their address and phone, so it opens only in a browser
// that placed the order or looked it up with the matching email. That browser gets a
// signed, httpOnly cookie per order number.

const MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const cookieName = (orderNumber: string) => `order_${orderNumber}`;
const sign = (orderNumber: string) =>
  hmacSign("order-access", getCloudflareContext().env.BETTER_AUTH_SECRET, orderNumber);

/** Route handlers and server actions only (pages can't set cookies). */
export async function grantOrderAccess(orderNumber: string) {
  const jar = await cookies();
  jar.set(cookieName(orderNumber), await sign(orderNumber), {
    httpOnly: true,
    secure: getCloudflareContext().env.NEXTJS_ENV !== "development",
    sameSite: "lax",
    path: "/orders",
    maxAge: MAX_AGE,
  });
}

export async function hasOrderAccess(orderNumber: string) {
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) return false;
  const value = (await cookies()).get(cookieName(orderNumber))?.value;
  return Boolean(value && safeEqual(value, await sign(orderNumber)));
}
