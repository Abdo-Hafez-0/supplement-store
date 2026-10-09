import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Drizzle client for the D1 binding. Use in dynamic routes, route handlers and server actions. */
export function getDb(): Db {
  return drizzle(getCloudflareContext().env.DB, { schema });
}

/** Same as getDb(), for code that may run during static generation. */
export async function getDbAsync(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
