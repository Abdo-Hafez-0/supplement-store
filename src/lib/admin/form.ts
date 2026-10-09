import { z } from "zod";
import type { FormState } from "@/components/admin/form-state";

/** Turns a Zod error into a FormState with the first message per field. */
export function invalid(error: z.ZodError, message = "Check the highlighted fields."): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", message: fieldErrors._form ?? message, fieldErrors };
}

/** SQLite unique-constraint failures surface as errors mentioning UNIQUE. */
export function isUniqueViolation(error: unknown, column?: string) {
  const text = String(error instanceof Error ? (error.cause ?? error.message) : error);
  return text.includes("UNIQUE constraint failed") && (!column || text.includes(column));
}

export function isForeignKeyViolation(error: unknown) {
  const text = String(error instanceof Error ? (error.cause ?? error.message) : error);
  return text.includes("FOREIGN KEY constraint failed");
}
