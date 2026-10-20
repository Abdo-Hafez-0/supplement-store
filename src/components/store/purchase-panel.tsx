"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { GiftIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import type { StoreTier } from "@/lib/db/queries/storefront";
import { formatCents } from "@/lib/money";
import { priceForQuantity } from "@/lib/pricing/tiers";
import { MediaImage } from "./media-image";

/**
 * Tier cards (or a quantity picker for products without tiers) and the gift preview.
 * Prices shown here are for display only; the server prices the cart.
 */
export function PurchasePanel({
  productId,
  tiers,
  regularPriceCents,
  offerActive,
  giftBadgeText,
  stock,
  maxQuantity,
}: {
  productId: number;
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
  const { add, pending, error } = useCart();
  /** Which button is adding: the selected bundle, or the one-bottle link */
  const [adding, setAdding] = useState<"selected" | "single" | null>(null);
  // The cart is priced by the server from the real quantity; the card only picks it.
  const bottles = selected ? selected.bottles : quantity;
  const displayTotal = selected
    ? offerActive
      ? selected.bundlePriceCents
      : selected.compareAtCents
    : regularPriceCents * quantity;
  const disabled = outOfStock || adding !== null || pending || (selected !== null && selected.bottles > stock);
  // "Or add just 1 bottle": offered while a bigger bundle is selected. Display only, priced
  // like the cart engine prices 1 bottle (1-bottle tier, else regular; regular once the offer ends).
  const showSingle = selected !== null && selected.bottles !== 1 && !outOfStock;
  const singlePriceCents = priceForQuantity(offerActive ? tiers : [], regularPriceCents, 1);

  // On phones, a bar with the Add to cart button stays at the bottom once the main button scrolls away.
  const mainButton = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = mainButton.current;
    if (!el) return;
    // Shown once the button is above the sticky header (h-16), which covers it first;
    // hidden again at the very bottom so it doesn't cover the footer's disclaimer.
    const headerPx = 64;
    let frame = 0;
    const check = () => {
      frame = 0;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
      setShowStickyBar(el.getBoundingClientRect().bottom < headerPx && !atEnd);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  async function addToCart(which: "selected" | "single" = "selected") {
    setAdding(which);
    await add(productId, which === "single" ? 1 : bottles);
    setAdding(null);
  }
  const label = outOfStock ? "Out of stock" : adding === "selected" ? "Adding…" : "Add to cart";

  return (
    <div className="flex flex-col gap-4">
      {tiers.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-heading text-base font-semibold">Choose your bundle</legend>
          {tiers.map((tier) => {
            const price = offerActive ? tier.bundlePriceCents : tier.compareAtCents;
            const showSavings = offerActive && tier.savingsCents > 0;
            const isSelected = tier.id === selectedId;
            const unavailable = tier.bottles > stock;
            return (
              <label
                key={tier.id}
                className={cn(
                  "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                  isSelected ? "border-accent bg-accent-soft shadow-card" : "border-border bg-surface hover:border-muted",
                  tier.badgeLabel && "mt-2",
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
                  className="peer sr-only"
                />
                {/* Custom radio dot */}
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected ? "border-accent" : "border-border",
                  )}
                >
                  {isSelected && <span className="size-2.5 rounded-full bg-accent" />}
                </span>
                {tier.badgeLabel && (
                  <Badge tone="accent" className="absolute -top-3 right-3 uppercase tracking-wide">
                    {tier.badgeLabel}
                  </Badge>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-semibold">
                      {tier.bottles} {tier.bottles === 1 ? "bottle" : "bottles"}
                    </span>
                    {tier.gift && giftBadgeText && <Badge tone="gift">{giftBadgeText}</Badge>}
                  </span>
                  {offerActive && tier.bottles > 1 && (
                    <span className="text-xs text-muted">{formatCents(tier.perBottleCents)} per bottle</span>
                  )}
                  {tier.gift && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-highlight-text">
                      <GiftIcon className="size-4" />+ {tier.gift.quantity} free {tier.gift.title}
                    </span>
                  )}
                  {unavailable && <span className="text-xs text-danger">Not enough stock</span>}
                </span>
                <span className="flex flex-col items-end gap-0.5">
                  <span className="text-lg font-bold tabular-nums">{formatCents(price)}</span>
                  {showSavings && (
                    <>
                      <s className="text-xs text-muted tabular-nums">{formatCents(tier.compareAtCents)}</s>
                      <Badge tone="highlight">Save {tier.savingsPercent}%</Badge>
                    </>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-3xl font-bold text-accent tabular-nums">{formatCents(regularPriceCents)}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="quantity" className="text-sm font-semibold">
              Quantity
            </label>
            <div className="flex items-center rounded-md border border-border bg-surface">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="p-3 disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <MinusIcon className="size-4" />
              </button>
              <input
                id="quantity"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => {
                  const next = Number(event.currentTarget.value.replace(/\D/g, ""));
                  setQuantity(Math.min(quantityCap, Math.max(1, next || 1)));
                }}
                className="w-10 bg-transparent text-center font-semibold tabular-nums"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                className="p-3 disabled:opacity-40"
                disabled={quantity >= quantityCap}
                onClick={() => setQuantity((q) => Math.min(quantityCap, q + 1))}
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selected?.gift && (
        <div className="flex items-center gap-3 rounded-lg border border-highlight bg-highlight-soft p-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface">
            {selected.gift.image ? (
              <MediaImage fileKey={selected.gift.image} alt="" sizes="56px" />
            ) : (
              <GiftIcon className="size-6 text-highlight-text" />
            )}
          </div>
          <p className="text-sm">
            <span className="font-bold text-highlight-text">Free gift: </span>
            {selected.gift.quantity} × {selected.gift.title}, added to your order automatically.
          </p>
        </div>
      )}

      <button
        ref={mainButton}
        type="button"
        disabled={disabled}
        onClick={() => addToCart()}
        className={cn(buttonClass("primary", "lg"), "w-full")}
      >
        {label}
        {!outOfStock && adding !== "selected" && (
          <span className="font-normal opacity-80">· {formatCents(displayTotal)}</span>
        )}
      </button>
      {showSingle && (
        <button
          type="button"
          // Still works when the selected bundle needs more bottles than are in stock
          disabled={adding !== null || pending}
          onClick={() => addToCart("single")}
          className="-mt-2 self-center rounded-sm px-2 py-1 text-sm text-muted underline underline-offset-2 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding === "single" ? "Adding…" : `or add just 1 bottle · ${formatCents(singlePriceCents)}`}
        </button>
      )}
      {error && !adding && (
        <p role="alert" className="-mt-2 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-raised backdrop-blur transition md:hidden",
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!showStickyBar}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted">
              {bottles} {bottles === 1 ? "bottle" : "bottles"}
              {selected?.gift ? ` + ${selected.gift.quantity} free ${selected.gift.quantity === 1 ? "gift" : "gifts"}` : ""}
            </span>
            <span className="font-bold tabular-nums">{formatCents(displayTotal)}</span>
          </div>
          <button
            type="button"
            tabIndex={showStickyBar ? 0 : -1}
            disabled={disabled}
            onClick={() => addToCart()}
            className={cn(buttonClass("primary", "lg"), "flex-1")}
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}
