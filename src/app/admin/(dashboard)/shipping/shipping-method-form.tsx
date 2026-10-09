"use client";

import { useRef, useState, useTransition } from "react";
import { idle, type FormState } from "@/components/admin/form-state";
import { useFormAction } from "@/components/admin/use-form-action";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { centsToDollarInput } from "@/lib/money";

export type ShippingMethodValues = {
  id: number;
  name: string;
  deliveryText: string;
  priceCents: number;
  freeOverCents: number | null;
  isActive: boolean;
  sortOrder: number;
};

export function ShippingMethodForm({
  method,
  saveAction,
  deleteAction,
}: {
  method: ShippingMethodValues | null;
  saveAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction?: () => Promise<FormState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, onSubmit, pending } = useFormAction(async (prev: FormState, formData: FormData) => {
    const result = await saveAction(prev, formData);
    // Clear the "add" form only after a successful save
    if (!method && result.status === "success") formRef.current?.reset();
    return result;
  });
  const [deleteState, setDeleteState] = useState<FormState>(idle);
  const [deleting, startDelete] = useTransition();
  const prefix = method ? `method-${method.id}` : "new-method";
  const id = (name: string) => `${prefix}-${name}`;
  const error = (name: string) => fieldError(state, name);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Name" htmlFor={id("name")} error={error("name")} className="lg:col-span-2">
          <Input id={id("name")} name="name" required maxLength={80} defaultValue={method?.name} placeholder="Standard shipping" />
        </Field>
        <Field label="Delivery text" htmlFor={id("deliveryText")} error={error("deliveryText")} className="lg:col-span-3">
          <Input
            id={id("deliveryText")}
            name="deliveryText"
            maxLength={120}
            defaultValue={method?.deliveryText}
            placeholder="Arrives in 3–5 business days"
          />
        </Field>
        <Field label="Price ($)" htmlFor={id("price")} hint="0 for free shipping" error={error("price")}>
          <Input
            id={id("price")}
            name="price"
            inputMode="decimal"
            required
            defaultValue={method ? centsToDollarInput(method.priceCents) : ""}
            placeholder="4.99"
          />
        </Field>
        <Field label="Free over ($)" htmlFor={id("freeOver")} hint="Optional subtotal for free shipping" error={error("freeOver")}>
          <Input
            id={id("freeOver")}
            name="freeOver"
            inputMode="decimal"
            defaultValue={method?.freeOverCents == null ? "" : centsToDollarInput(method.freeOverCents)}
            placeholder="75.00"
          />
        </Field>
        <Field label="Sort order" htmlFor={id("sortOrder")} error={error("sortOrder")}>
          <Input id={id("sortOrder")} name="sortOrder" inputMode="numeric" required defaultValue={method?.sortOrder ?? 0} />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox name="isActive" label="Active at checkout" defaultChecked={method?.isActive ?? true} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{method ? "Save" : "Add shipping method"}</SubmitButton>
        {method && deleteAction && (
          <Button
            variant="danger"
            disabled={deleting}
            onClick={() => {
              if (window.confirm(`Delete "${method.name}"?`)) startDelete(async () => setDeleteState(await deleteAction()));
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <FormMessage state={deleteState.status !== "idle" ? deleteState : state} />
      </div>
    </form>
  );
}
