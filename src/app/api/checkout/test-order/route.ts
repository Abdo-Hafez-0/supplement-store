import { readCartId } from "@/lib/cart";
import { readJson, requireJson } from "@/lib/cart/http";
import { quoteCheckout, quoteErrors, testOrdersAllowed } from "@/lib/checkout";
import { getDb } from "@/lib/db/client";
import { createPendingOrder, markOrderPaid } from "@/lib/orders";
import { grantOrderAccess } from "@/lib/orders/access";
import { getRequestSettings } from "@/lib/settings";
import { checkoutDetailsSchema } from "@/lib/validation/checkout";

/**
 * LOCAL DEVELOPMENT ONLY (NEXTJS_ENV=development, from .dev.vars): places an order and
 * marks it paid without PayPal, through the same order code the PayPal capture and
 * webhook will use. Answers 404 everywhere else, including the deployed site.
 */
export async function POST(request: Request) {
  if (!testOrdersAllowed()) return new Response("Not found", { status: 404 });
  const notJson = requireJson(request);
  if (notJson) return notJson;
  const parsed = checkoutDetailsSchema.safeParse(await readJson(request));
  if (!parsed.success) return Response.json({ error: "Invalid details" }, { status: 400 });

  const db = getDb();
  const cartId = await readCartId();
  const quote = await quoteCheckout(db, cartId, await getRequestSettings(), parsed.data.shippingMethodId);
  if (!quote.ok) return Response.json({ error: quoteErrors[quote.reason] }, { status: 409 });

  const paypalOrderId = `TEST-${crypto.randomUUID()}`;
  const { orderNumber } = await createPendingOrder(db, {
    details: parsed.data,
    cart: quote.cart,
    method: quote.method,
    paypalOrderId,
    cartId,
  });
  await markOrderPaid(db, { paypalOrderId, captureId: `TEST-CAPTURE-${crypto.randomUUID()}` });
  await grantOrderAccess(orderNumber);
  return Response.json({ orderNumber });
}
