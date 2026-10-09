"use client";

import { useState, useTransition } from "react";
import { idle, type FormState } from "@/components/admin/form-state";
import { useFormAction } from "@/components/admin/use-form-action";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { centsToDollarInput } from "@/lib/money";
import type { ProductOption } from "./tier-rows";

export function OrderBumpForm({
  productId,
  initial,
  productOptions,
  saveAction,
  deleteAction,
}: {
  productId: number;
  initial: { bumpProductId: number; bumpPriceCents: number; headline: string } | null;
  productOptions: ProductOption[];
  saveAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction: () => Promise<FormState>;
}) {
  const { state, onSubmit, pending } = useFormAction(saveAction);
  const [removeState, setRemoveState] = useState<FormState>(idle);
  const [removing, startRemove] = useTransition();
  const error = (name: string) => fieldError(state, name);
  const options = productOptions.filter((product) => product.id !== productId);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Offered product" htmlFor="bumpProductId" error={error("bumpProductId")}>
          <Select id="bumpProductId" name="bumpProductId" required defaultValue={initial?.bumpProductId ?? ""}>
            <option value="" disabled>
              Choose…
            </option>
            {options.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
                {product.status === "draft" ? " (draft)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bump price ($)" htmlFor="bumpPrice" hint="Single item, no tiers or gifts." error={error("bumpPrice")}>
          <Input
            id="bumpPrice"
            name="bumpPrice"
            inputMode="decimal"
            required
            placeholder="9.99"
            defaultValue={initial ? centsToDollarInput(initial.bumpPriceCents) : ""}
          />
        </Field>
        <Field label="Checkbox text" htmlFor="headline" hint='e.g. "Yes, add a shaker bottle for $9.99"' error={error("headline")}>
          <Input id="headline" name="headline" required maxLength={200} defaultValue={initial?.headline ?? ""} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>Save order bump</SubmitButton>
        {initial && (
          <Button
            variant="danger"
            disabled={removing}
            onClick={() => startRemove(async () => setRemoveState(await deleteAction()))}
          >
            {removing ? "Removing…" : "Remove bump"}
          </Button>
        )}
        <FormMessage state={removeState.status !== "idle" ? removeState : state} />
      </div>
    </form>
  );
}
