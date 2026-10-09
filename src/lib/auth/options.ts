import type { BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "./password";

/** Database-independent options, shared by the runtime instance and the schema generator. */
export const authOptions = {
  emailAndPassword: {
    enabled: true,
    // Admin login only. The first admin is created by /api/admin/bootstrap.
    disableSignUp: true,
    minPasswordLength: 12,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  // Counters live in D1 so every Worker isolate sees the same limits.
  // Only browser requests to /api/auth are limited (not server-side auth.api calls),
  // which is why the login form calls the auth client.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 300, max: 5 },
    },
  },
  advanced: {
    // The client IP on Cloudflare; x-forwarded-for can be spoofed.
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
  },
  // nextCookies must stay last
  plugins: [nextCookies()],
} satisfies BetterAuthOptions;
