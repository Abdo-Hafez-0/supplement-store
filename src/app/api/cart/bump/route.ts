import { readCartId, setBump } from "@/lib/cart";
import { cartResponse, readJson, requireJson } from "@/lib/cart/http";
import { getDb } from "@/lib/db/client";
import { getRequestSettings } from "@/lib/settings";
import { setBumpSchema } from "@/lib/validation/cart";

/**
 * Accepts or declines the order bump on offer. Body: { accept } — the server decides
 * which bump applies and what it costs.
 */
export async function PUT(request: Request) {
  const notJson = requireJson(request);
  if (notJson) return notJson;
  const parsed = setBumpSchema.safeParse(await readJson(request));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const cartId = await readCartId();
  if (!cartId) return Response.json({ error: "Your cart is empty." }, { status: 404 });
  const ok = await setBump(getDb(), cartId, parsed.data.accept, await getRequestSettings());
  if (!ok) return Response.json({ error: "This offer is no longer available." }, { status: 409 });
  return cartResponse(cartId);
}
