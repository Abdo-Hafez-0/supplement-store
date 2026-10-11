import { readCartId, setLineQuantity } from "@/lib/cart";
import { cartResponse, readJson, requireJson } from "@/lib/cart/http";
import { getDb } from "@/lib/db/client";
import { lineIdSchema, setQuantitySchema } from "@/lib/validation/cart";

async function change(id: string, quantity: number) {
  const lineId = lineIdSchema.safeParse(id);
  const cartId = await readCartId();
  if (!lineId.success || !cartId) return Response.json({ error: "Not found" }, { status: 404 });
  // Gift lines follow their parent and can't be changed on their own
  const ok = await setLineQuantity(getDb(), cartId, lineId.data, quantity);
  if (!ok) return Response.json({ error: "This line can't be changed." }, { status: 404 });
  return cartResponse(cartId);
}

/** Changes a paid line's quantity. Body: { quantity } (0 removes it). */
export async function PATCH(request: Request, { params }: RouteContext<"/api/cart/items/[id]">) {
  const notJson = requireJson(request);
  if (notJson) return notJson;
  const parsed = setQuantitySchema.safeParse(await readJson(request));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  return change((await params).id, parsed.data.quantity);
}

/** Removes a paid line (and its gift line). */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/cart/items/[id]">) {
  return change((await params).id, 0);
}
