"use client";

import { useActionState } from "react";
import { idle, type FormState } from "@/components/admin/form-state";
import { FormMessage, SubmitButton } from "@/components/admin/form-status";

export function DeleteProduct({
  title,
  action,
}: {
  title: string;
  action: (prev: FormState) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, idle);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${title}"? Its tiers, gifts, bump and review images are deleted too. Past orders are not affected.`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <SubmitButton variant="danger" pendingText="Deleting…">
        Delete product
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
