import { z } from "zod";

export const signInSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const bootstrapAdminSchema = z.strictObject({
  password: z.string().min(1).max(128),
});
