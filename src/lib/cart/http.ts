import "server-only";
import { getDb } from "@/lib/db/client";
import { getRequestSettings } from "@/lib/settings";
import { getPricedCart, readCartId } from "./index";

/**
 * Cart changes only accept JSON. A cross-site HTML form can't send that content type
 * without a CORS preflight, which together with SameSite=Lax cookies blocks CSRF.
 */
export function requireJson(request: Request): Response | null {
  const type = request.headers.get("content-type") ?? "";
  return type.split(";")[0].trim() === "application/json"
    ? null
    : Response.json({ error: "Expected JSON" }, { status: 415 });
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

/** The freshly priced cart as the API response. Never cached. */
export async function cartResponse(cartId?: string | null, status = 200) {
  const id = cartId === undefined ? await readCartId() : cartId;
  const cart = await getPricedCart(getDb(), id, await getRequestSettings());
  const { cartId: _id, ...body } = cart;
  void _id;
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
