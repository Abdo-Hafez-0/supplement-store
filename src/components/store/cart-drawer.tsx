"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PricedBump, PricedLine } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { BagIcon, CloseIcon, GiftIcon, MinusIcon, PlusIcon, TruckIcon } from "@/components/ui/icons";
import { formatCents } from "@/lib/money";
import { useCart } from "./cart-context";
import { ImagePlaceholder, MediaImage } from "./media-image";

export function CartButton() {
  const { cart, open } = useCart();
  const count = cart?.itemCount ?? 0;
  return (
    <button
      type="button"
      onClick={open}
      className="relative flex items-center gap-1.5 rounded-md px-2 py-2 hover:text-accent"
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <BagIcon className="size-6" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -top-0.5 left-5 inline-flex min-w-5 items-center justify-center rounded-full bg-highlight px-1 text-xs font-bold text-highlight-foreground sm:static">
          {count}
        </span>
      )}
    </button>
  );
}

function Thumb({ image, alt }: { image: string | null; alt: string }) {
  return (
    <div className="size-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
      {image ? <MediaImage fileKey={image} alt={alt} sizes="64px" /> : <ImagePlaceholder />}
    </div>
  );
}

function LineItem({ line }: { line: PricedLine }) {
  const { setQuantity, remove, pending, close } = useCart();
  const notes = [
    line.issues.includes("reduced_to_stock") && `Only ${line.quantity} left in stock`,
    line.issues.includes("reduced_to_max") && `Limit ${line.quantity} per order`,
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex gap-3">
        <Thumb image={line.image} alt={line.title} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={`/products/${line.slug}`} onClick={close} className="font-heading text-sm font-semibold hover:underline">
            {line.title}
          </Link>
          {line.tierBottles !== null && line.tierBottles > 1 && (
            <p className="text-xs text-muted">{line.tierBottles}-bottle bundle price</p>
          )}
          {notes.map((note) => (
            <p key={String(note)} className="text-xs text-warning">
              {note}
            </p>
          ))}
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center rounded-md border border-border bg-surface">
              <button
                type="button"
                className="p-2 disabled:opacity-40"
                disabled={pending}
                onClick={() => (line.quantity <= 1 ? remove(line.id) : setQuantity(line.id, line.quantity - 1))}
                aria-label={line.quantity <= 1 ? `Remove ${line.title}` : `One fewer ${line.title}`}
              >
                <MinusIcon className="size-4" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-label="Quantity">
                {line.quantity}
              </span>
              <button
                type="button"
                className="p-2 disabled:opacity-40"
                disabled={pending}
                onClick={() => setQuantity(line.id, line.quantity + 1)}
                aria-label={`One more ${line.title}`}
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="font-bold tabular-nums">{formatCents(line.lineTotalCents)}</p>
              {line.compareAtCents > line.lineTotalCents && (
                <s className="text-xs text-muted tabular-nums">{formatCents(line.compareAtCents)}</s>
              )}
            </div>
          </div>
          <button
            type="button"
            className="self-start text-xs text-muted underline underline-offset-2 hover:text-danger disabled:opacity-40"
            disabled={pending}
            onClick={() => remove(line.id)}
          >
            Remove
          </button>
        </div>
      </div>

      {line.gift && (
        // Gift lines follow their parent: no controls of their own
        <div className="ml-6 flex items-center gap-3 rounded-lg border border-highlight bg-highlight-soft p-2">
          <Thumb image={line.gift.image} alt="" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <Badge tone="highlight">
              <GiftIcon className="size-3.5" />
              FREE GIFT
            </Badge>
            <span className="text-sm">
              {line.gift.quantity} × {line.gift.title}
            </span>
          </div>
          <span className="pr-1 text-sm font-bold text-highlight-text">Free</span>
        </div>
      )}
    </li>
  );
}

/** The order bump: one checkbox offer, priced by the server. */
export function BumpOffer({ bump }: { bump: PricedBump }) {
  const { setBump, pending } = useCart();
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-highlight bg-highlight-soft p-3 has-checked:border-solid has-checked:border-accent has-checked:bg-accent-soft">
      <input
        type="checkbox"
        checked={bump.accepted}
        disabled={pending}
        onChange={(event) => setBump(event.currentTarget.checked)}
        className="size-5 shrink-0 accent-accent"
      />
      <Thumb image={bump.image} alt="" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{bump.headline}</span>
        <span className="text-xs text-muted">{bump.title}</span>
      </span>
      <span className="flex flex-col items-end">
        <span className="font-bold tabular-nums">{formatCents(bump.priceCents)}</span>
        {bump.compareAtCents > bump.priceCents && (
          <s className="text-xs text-muted tabular-nums">{formatCents(bump.compareAtCents)}</s>
        )}
      </span>
    </label>
  );
}

export function CartDrawer() {
  const { cart, isOpen, close, pending, error, freeShippingText } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  const removedNotes = cart?.removed.map((item) =>
    item.reason === "out_of_stock"
      ? `${item.title ?? "A product"} sold out and was removed.`
      : `${item.title ?? "A product"} is no longer available and was removed.`,
  );

  return (
    <dialog
      ref={dialog}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
      aria-labelledby="cart-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-background p-0 text-text shadow-raised backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-gutter py-3">
          <h2 id="cart-title" className="font-heading text-lg font-bold">
            Your cart {cart && cart.itemCount > 0 ? `(${cart.itemCount})` : ""}
          </h2>
          <button type="button" onClick={close} aria-label="Close cart" className="rounded-md p-2 hover:bg-surface-muted">
            <CloseIcon />
          </button>
        </header>
        {freeShippingText && cart && cart.lines.length > 0 && (
          <p className="flex items-center justify-center gap-2 bg-accent-soft px-gutter py-2 text-sm font-medium text-accent">
            <TruckIcon className="size-4" />
            {freeShippingText}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-gutter" aria-busy={pending}>
          {removedNotes?.map((note) => (
            <p key={note} role="status" className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-sm">
              {note}
            </p>
          ))}
          {error && (
            <p role="alert" className="mt-3 rounded-md border border-danger px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {!cart ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : cart.lines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <BagIcon className="size-10 text-muted" />
              <p className="text-muted">Your cart is empty.</p>
              <Link href="/products" onClick={close} className={buttonClass("primary", "md")}>
                Shop products
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.lines.map((line) => (
                <LineItem key={line.id} line={line} />
              ))}
            </ul>
          )}
        </div>

        {cart && cart.lines.length > 0 && (
          <footer className="flex flex-col gap-3 border-t border-border bg-surface px-gutter pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {cart.bump && <BumpOffer bump={cart.bump} />}
            {cart.savingsCents > 0 && (
              <p className="flex justify-between text-sm font-semibold text-success">
                <span>You save</span>
                <span className="tabular-nums">{formatCents(cart.savingsCents)}</span>
              </p>
            )}
            <p className="flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCents(cart.subtotalCents)}</span>
            </p>
            <p className="text-xs text-muted">Shipping is chosen at checkout.</p>
            <Link
              href="/checkout"
              onClick={close}
              aria-disabled={pending}
              className={cn(buttonClass("primary", "lg"), "w-full", pending && "pointer-events-none opacity-60")}
            >
              Checkout
            </Link>
          </footer>
        )}
      </div>
    </dialog>
  );
}
