"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { idle, type FormState } from "./form-state";

/**
 * Runs a server action from a form's onSubmit instead of `<form action>`.
 * React resets uncontrolled fields after every `<form action>` submission, which
 * would wipe what the admin typed whenever validation fails.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, idle);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }
  return { state, onSubmit, pending };
}
