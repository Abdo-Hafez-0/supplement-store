/** Result of an admin server action, rendered by <FormStatus>. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const idle: FormState = { status: "idle" };
