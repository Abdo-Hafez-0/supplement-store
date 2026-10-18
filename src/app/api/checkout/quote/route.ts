import { z } from "zod";
import { readCartId } from "@/lib/cart";
import { readJson, requireJson } from "@/lib/cart/http";
import { paymentsConnected, quoteCheckout, quoteErrors, testOrdersAllowed } from "@/lib/checkout";
import { getDb } from "@/lib/db/client";
import { getRequestSettings } from "@/lib/settings";
import { checkoutDetailsSchema } from "@/lib/validation/checkout";

/**
 * Checks the customer's details and returns the order total, priced on the server.
 * The payment step (PayPal) starts from this quote.
 */
export async function POST(request: Request) {
  const notJson = requireJson(request);
  if (notJson) return notJson;
  const parsed = checkoutDetailsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
    );
    return Response.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const quote = await quoteCheckout(getDb(), await readCartId(), await getRequestSettings(), parsed.data.shippingMethodId);
  const { cartId: _id, ...cart } = quote.cart;
  void _id;
  if (!quote.ok) {
    return Response.json({ error: quoteErrors[quote.reason], reason: quote.reason, cart }, { status: 409 });
  }
  return Response.json(
    {
      cart,
      method: quote.method,
      totals: quote.totals,
      paymentsConnected: paymentsConnected(),
      testOrdersAllowed: testOrdersAllowed(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
