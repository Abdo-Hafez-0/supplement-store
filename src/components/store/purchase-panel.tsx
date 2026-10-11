"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import type { StoreTier } from "@/lib/db/queries/storefront";
import { formatCents } from "@/lib/money";
import { MediaImage } from "./media-image";

/**
 * Tier cards (or a quantity picker for products without tiers) and the gift preview.
 * Prices shown here are for display only; the server prices the cart (M3).
 */
export function PurchasePanel({
  tiers,
  regularPriceCents,
  offerActive,
  giftBadgeText,
  stock,
  maxQuantity,
}: {
  tiers: StoreTier[];
  regularPriceCents: number;
  /** False while the visitor's offer has expired: regular prices apply */
  offerActive: boolean;
  giftBadgeText: string;
  stock: number;
  maxQuantity: number | null;
}) {
  const defaultTier = tiers.find((tier) => tier.isDefault) ?? tiers[0];
  const [selectedId, setSelectedId] = useState(defaultTier?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const selected = tiers.find((tier) => tier.id === selectedId) ?? null;
  const outOfStock = stock <= 0;
  const quantityCap = Math.max(1, Math.min(stock, maxQuantity ?? 99));

  return (
    <div className="flex flex-col gap-4">
      {tiers.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Choose your bundle</legend>
          {tiers.map((tier) => {
            const price = offerActive ? tier.bundlePriceCents : tier.compareAtCents;
            const showSavings = offerActive && tier.savingsCents > 0;
            const isSelected = tier.id === selectedId;
            const unavailable = tier.bottles > stock;
            return (
              <label
                key={tier.id}
                className={cn(
                  "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-surface p-4 transition",
                  isSelected ? "border-accent" : "border-border hover:border-muted",
                  unavailable && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.id}
                  checked={isSelected}
                  disabled={unavailable}
                  onChange={() => setSelectedId(tier.id)}
                  className="size-4 shrink-0 accent-accent"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {tier.bottles} {tier.bottles === 1 ? "bottle" : "bottles"}
                    </span>
                    {tier.badgeLabel && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        {tier.badgeLabel}
                      </span>
                    )}
                    {tier.gift && giftBadgeText && (
                      <span className="rounded-full bg-success px-2 py-0.5 text-xs font-medium text-white">
                        {giftBadgeText}
                      </span>
                    )}
                  </span>
                  {offerActive && tier.bottles > 1 && (
                    <span className="text-xs text-muted">{formatCents(tier.perBottleCents)} per bottle</span>
                  )}
                  {tier.gift && (
                    <span className="text-xs font-medium text-success">
                      + {tier.gift.quantity} free {tier.gift.title}
                    </span>
                  )}
                  {unavailable && <span className="text-xs text-danger">Not enough stock</span>}
                </span>
                <span className="flex flex-col items-end">
                  <span className="font-semibold tabular-nums">{formatCents(price)}</span>
                  {showSavings && (
                    <>
                      <s className="text-xs text-muted tabular-nums">{formatCents(tier.compareAtCents)}</s>
                      <span className="text-xs font-medium text-success">Save {tier.savingsPercent}%</span>
                    </>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-semibold tabular-nums">{formatCents(regularPriceCents)}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </label>
            <div className="flex items-center rounded-md border border-border bg-surface">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="px-3 py-2 disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <input
                id="quantity"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => {
                  const next = Number(event.currentTarget.value.replace(/\D/g, ""));
                  setQuantity(Math.min(quantityCap, Math.max(1, next || 1)));
                }}
                className="w-12 bg-transparent text-center tabular-nums"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                className="px-3 py-2 disabled:opacity-40"
                disabled={quantity >= quantityCap}
                onClick={() => setQuantity((q) => Math.min(quantityCap, q + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {selected?.gift && (
        <div className="flex items-center gap-3 rounded-lg border border-success bg-surface p-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
            {selected.gift.image && <MediaImage fileKey={selected.gift.image} alt="" sizes="56px" />}
          </div>
          <p className="text-sm">
            <span className="font-semibold">Free gift:</span> {selected.gift.quantity} × {selected.gift.title}, added to
            your order automatically.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled
        title="The cart arrives in the next update (M3)"
        className="rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {outOfStock ? "Out of stock" : "Add to cart"}
      </button>
      {!outOfStock && <p className="-mt-2 text-center text-xs text-muted">Prototype: the cart opens in the next milestone.</p>}
    </div>
  );
}
