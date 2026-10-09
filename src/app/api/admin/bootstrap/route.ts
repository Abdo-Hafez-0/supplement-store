import { createHash, timingSafeEqual } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { bootstrapAdminSchema } from "@/lib/validation/auth";

function sameSecret(a: string, b: string) {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * One-time creation of the first admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * The caller must send ADMIN_PASSWORD in the body, and it only works while
 * there are no users at all.
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) {
    return Response.json({ error: "ADMIN_EMAIL and ADMIN_PASSWORD are not set" }, { status: 500 });
  }

  const parsed = bootstrapAdminSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !sameSecret(parsed.data.password, password)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const ctx = await getAuth().$context;
  if ((await ctx.internalAdapter.countTotalUsers()) > 0) {
    return Response.json({ error: "An admin user already exists" }, { status: 409 });
  }
  if (password.length < ctx.password.config.minPasswordLength) {
    return Response.json({ error: "ADMIN_PASSWORD is too short" }, { status: 400 });
  }

  const user = await ctx.internalAdapter.createUser(
    { email: email.toLowerCase(), name: "Admin", emailVerified: true },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(password),
  });

  return Response.json({ created: user.email }, { status: 201 });
}
