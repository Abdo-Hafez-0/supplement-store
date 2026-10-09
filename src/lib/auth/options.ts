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
  // nextCookies must stay last
  plugins: [nextCookies()],
} satisfies BetterAuthOptions;
