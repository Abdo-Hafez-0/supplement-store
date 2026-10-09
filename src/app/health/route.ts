import { count } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { version } from "../../../package.json";

// Reads D1 on every request; never prerender.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [row] = await getDb().select({ value: count() }).from(products);
    return Response.json({ status: "ok", version, products: row?.value ?? 0 });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ status: "error", version, error: "database unavailable" }, { status: 503 });
  }
}
