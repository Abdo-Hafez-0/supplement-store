import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { authOptions } from "./options";

function createAuth() {
  const { env } = getCloudflareContext();
  const isDev = env.NEXTJS_ENV === "development";
  return betterAuth({
    ...authOptions,
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    // `next dev` (3000) and `npm run preview` (8787) both post to the local auth API
    trustedOrigins: isDev ? ["http://localhost:3000", "http://localhost:8787"] : [],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** One Better Auth instance per request; bindings are only available inside a request. */
export const getAuth = cache(createAuth);

/** The current admin session, or null. Always checked on the server. */
export async function getSession() {
  // Read headers first: it marks the route dynamic before the Cloudflare context is touched.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}

/**
 * For admin pages and server actions: redirects to the login page unless there is a
 * session. Server actions are public endpoints, so every admin action calls this first.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For admin route handlers: a 401 response when there is no session, otherwise null. */
export async function adminApiGuard(): Promise<Response | null> {
  const session = await getSession();
  return session ? null : Response.json({ error: "Unauthorized" }, { status: 401 });
}
