"use client";

import { useActionState } from "react";
import { lookupOrder, type LookupState } from "@/app/(store)/orders/actions";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, Input } from "@/components/ui/field";

export function OrderLookupForm({ orderNumber = "" }: { orderNumber?: string }) {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, { error: null });
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email used for the order" htmlFor="lookup-email">
        <Input id="lookup-email" name="email" type="email" autoComplete="email" required maxLength={254} className="py-3 text-base" />
      </Field>
      <Field label="Order number" htmlFor="lookup-number" hint="In your confirmation email, e.g. DX-7K3M9QX2.">
        <Input
          id="lookup-number"
          name="orderNumber"
          required
          maxLength={20}
          defaultValue={orderNumber}
          autoCapitalize="characters"
          className="py-3 text-base uppercase"
        />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={cn(buttonClass("primary", "lg"), "w-full")}>
        {pending ? "Looking up…" : "Find my order"}
      </button>
    </form>
  );
}
