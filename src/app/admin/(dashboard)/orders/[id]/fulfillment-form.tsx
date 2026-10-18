"use client";

import type { FormState } from "@/components/admin/form-state";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { useFormAction } from "@/components/admin/use-form-action";
import { Field, Input, Select } from "@/components/ui/field";
import type { AdminOrderStatus } from "@/lib/orders";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function FulfillmentForm({
  status,
  trackingNumber,
  action,
}: {
  status: AdminOrderStatus;
  trackingNumber: string | null;
  action: Action;
}) {
  const { state, onSubmit, pending } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="status" error={fieldError(state, "status")}>
          <Select id="status" name="status" defaultValue={status}>
            <option value="paid">Paid (to ship)</option>
            <option value="shipped">Shipped</option>
            <option value="refunded">Refunded</option>
          </Select>
        </Field>
        <Field
          label="Tracking number"
          htmlFor="trackingNumber"
          hint="Shown to the customer on their order page."
          error={fieldError(state, "trackingNumber")}
        >
          <Input id="trackingNumber" name="trackingNumber" maxLength={100} defaultValue={trackingNumber ?? ""} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>Save</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
