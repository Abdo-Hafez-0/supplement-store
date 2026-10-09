// Used only by `npm run auth:generate` to write Better Auth's tables into
// src/lib/db/auth-schema.ts. The app uses getAuth() from src/lib/auth.
import { betterAuth } from "better-auth";
import { authOptions } from "./src/lib/auth/options";

export const auth = betterAuth(authOptions);
