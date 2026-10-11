import { cartResponse } from "@/lib/cart/http";

/** The visitor's cart, priced from the database. */
export async function GET() {
  return cartResponse();
}
