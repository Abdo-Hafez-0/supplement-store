import { and, eq, ne } from "drizzle-orm";
import { addToCart, ensureCart } from "@/lib/cart";
import { cartResponse, readJson, requireJson } from "@/lib/cart/http";
import { getDb } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { addToCartSchema } from "@/lib/validation/cart";

/** Adds bottles of a product. Body: { productId, quantity } — never a price. */
export async function POST(request: Request) {
  const notJson = requireJson(request);
  if (notJson) return notJson;
  const parsed = addToCartSchema.safeParse(await readJson(request));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { productId, quantity } = parsed.data;

  const db = getDb();
  const [product] = await db
    .select({ stock: products.stock })
    .from(products)
    .where(and(eq(products.id, productId), ne(products.status, "draft")));
  if (!product) return Response.json({ error: "This product is not available." }, { status: 404 });
  if (product.stock <= 0) return Response.json({ error: "This product is out of stock." }, { status: 409 });

  const cartId = await ensureCart(db);
  await addToCart(db, cartId, productId, quantity);
  // Pricing (tiers, gifts, stock and cart-cap limits) happens here, from the database
  return cartResponse(cartId);
}
