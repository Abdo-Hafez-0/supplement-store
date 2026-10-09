"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";
import type { FormState } from "./form-state";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  /** From useFormAction; useFormStatus only sees `<form action>` submissions. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}
    >
      {state.message}
    </p>
  );
}

export function fieldError(state: FormState, name: string) {
  return state.status === "error" ? state.fieldErrors?.[name] : undefined;
}
