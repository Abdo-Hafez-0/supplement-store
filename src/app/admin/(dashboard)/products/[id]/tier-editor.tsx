"use client";

import { useState } from "react";
import type { FormState } from "@/components/admin/form-state";
import { useFormAction } from "@/components/admin/use-form-action";
import { FormMessage, SubmitButton } from "@/components/admin/form-status";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { formatCents, parseDollarsToCents } from "@/lib/money";
import type { TierInput } from "@/lib/validation/admin";
import type { ProductOption, TierRow } from "./tier-rows";

/** Rows -> the JSON the server validates. Non-numeric input is passed through so the server rejects it. */
function toPayload(rows: TierRow[]): TierInput[] {
  const num = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : (value as unknown as number));
  return rows.map((row) => ({
    bottles: num(row.bottles),
    bundlePrice: row.bundlePrice,
    badgeLabel: row.badgeLabel,
    isDefault: row.isDefault,
    gift: row.hasGift
      ? {
          giftProductId: num(row.giftProductId),
          substituteProductId: row.substituteProductId ? num(row.substituteProductId) : null,
          giftQty: row.giftQty.trim() === "" ? null : num(row.giftQty),
        }
      : null,
  }));
}

let nextRow = 0;
const newRowId = () => `new-${nextRow++}`;

export function TierEditor({
  initial,
  regularPriceCents,
  productOptions,
  action,
}: {
  initial: TierRow[];
  regularPriceCents: number;
  productOptions: ProductOption[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const { state, onSubmit, pending } = useFormAction(action);
  const [rows, setRows] = useState(initial);

  const update = (rowId: string, patch: Partial<TierRow>) =>
    setRows((list) =>
      list.map((row) =>
        row.rowId === rowId
          ? { ...row, ...patch }
          : patch.isDefault // only one preselected tier
            ? { ...row, isDefault: false }
            : row,
      ),
    );

  function addTier() {
    const highest = Math.max(0, ...rows.map((row) => Number(row.bottles) || 0));
    setRows((list) => [
      ...list,
      {
        rowId: newRowId(),
        bottles: String(highest + 1),
        bundlePrice: "",
        badgeLabel: "",
        isDefault: false,
        hasGift: false,
        giftProductId: "",
        substituteProductId: "",
        giftQty: "",
      },
    ]);
  }

  const option = (product: ProductOption) => (
    <option key={product.id} value={product.id}>
      {product.title}
      {product.status === "draft" ? " (draft)" : ""} — {product.stock} in stock
    </option>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="tiers" value={JSON.stringify(toPayload(rows))} />

      {rows.length === 0 && (
        <p className="text-sm text-muted">
          No tiers: this product sells at its regular price ({formatCents(regularPriceCents)}).
        </p>
      )}

      {rows.map((row, index) => {
        const bottles = Number(row.bottles);
        const bundle = parseDollarsToCents(row.bundlePrice);
        const perBottle = bundle !== null && bottles > 0 ? Math.round(bundle / bottles) : null;
        const saving = bundle !== null && bottles > 0 ? regularPriceCents * bottles - bundle : null;
        const defaultGiftQty = bottles > 0 ? bottles - 1 : 0;
        const id = (name: string) => `tier-${row.rowId}-${name}`;

        return (
          <fieldset key={row.rowId} className="rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium">Tier {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Bottles" htmlFor={id("bottles")}>
                <Input
                  id={id("bottles")}
                  inputMode="numeric"
                  value={row.bottles}
                  onChange={(event) => update(row.rowId, { bottles: event.currentTarget.value })}
                />
              </Field>
              <Field
                label="Bundle price ($)"
                htmlFor={id("price")}
                hint={
                  perBottle !== null
                    ? `${formatCents(perBottle)} per bottle${saving && saving > 0 ? ` · saves ${formatCents(saving)}` : ""}`
                    : "Price for all bottles together"
                }
              >
                <Input
                  id={id("price")}
                  inputMode="decimal"
                  placeholder="99.00"
                  value={row.bundlePrice}
                  onChange={(event) => update(row.rowId, { bundlePrice: event.currentTarget.value })}
                />
              </Field>
              <Field label="Badge (optional)" htmlFor={id("badge")} hint='e.g. "Most popular"'>
                <Input
                  id={id("badge")}
                  maxLength={40}
                  value={row.badgeLabel}
                  onChange={(event) => update(row.rowId, { badgeLabel: event.currentTarget.value })}
                />
              </Field>
              <div className="flex flex-col justify-center gap-2">
                <Checkbox
                  label="Preselected"
                  checked={row.isDefault}
                  onChange={(event) => update(row.rowId, { isDefault: event.currentTarget.checked })}
                />
                <Checkbox
                  label="Includes a gift"
                  checked={row.hasGift}
                  onChange={(event) => update(row.rowId, { hasGift: event.currentTarget.checked })}
                />
              </div>
            </div>

            {row.hasGift && (
              <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
                <Field label="Gift product" htmlFor={id("gift")}>
                  <Select
                    id={id("gift")}
                    value={row.giftProductId}
                    onChange={(event) => update(row.rowId, { giftProductId: event.currentTarget.value })}
                  >
                    <option value="">Choose…</option>
                    {productOptions.map(option)}
                  </Select>
                </Field>
                <Field label="Substitute if out of stock" htmlFor={id("substitute")} hint="Optional">
                  <Select
                    id={id("substitute")}
                    value={row.substituteProductId}
                    onChange={(event) => update(row.rowId, { substituteProductId: event.currentTarget.value })}
                  >
                    <option value="">None</option>
                    {productOptions.filter((product) => String(product.id) !== row.giftProductId).map(option)}
                  </Select>
                </Field>
                <Field
                  label="Gift quantity"
                  htmlFor={id("qty")}
                  hint={`Leave empty for the default: bottles − 1 = ${defaultGiftQty}`}
                >
                  <Input
                    id={id("qty")}
                    inputMode="numeric"
                    placeholder={String(defaultGiftQty)}
                    value={row.giftQty}
                    onChange={(event) => update(row.rowId, { giftQty: event.currentTarget.value })}
                  />
                </Field>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="danger"
                onClick={() => setRows((list) => list.filter((r) => r.rowId !== row.rowId))}
              >
                Remove tier
              </Button>
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={addTier} disabled={rows.length >= 10}>
          Add tier
        </Button>
        <SubmitButton pending={pending}>Save tiers</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
