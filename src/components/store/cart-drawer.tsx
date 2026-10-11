"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PricedBump, PricedLine } from "@/lib/pricing";
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
      className="relative rounded-md px-2 py-1 text-sm hover:bg-surface-muted"
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

function Thumb({ image, alt }: { image: string | null; alt: string }) {
  return (
    <div className="size-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
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
          <Link href={`/products/${line.slug}`} onClick={close} className="text-sm font-medium hover:underline">
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
            <div className="flex items-center rounded-md border border-border">
              <button
                type="button"
                className="px-2.5 py-1 disabled:opacity-40"
                disabled={pending}
                onClick={() => (line.quantity <= 1 ? remove(line.id) : setQuantity(line.id, line.quantity - 1))}
                aria-label={line.quantity <= 1 ? `Remove ${line.title}` : `One fewer ${line.title}`}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm tabular-nums" aria-label="Quantity">
                {line.quantity}
              </span>
              <button
                type="button"
                className="px-2.5 py-1 disabled:opacity-40"
                disabled={pending}
                onClick={() => setQuantity(line.id, line.quantity + 1)}
                aria-label={`One more ${line.title}`}
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatCents(line.lineTotalCents)}</p>
              {line.compareAtCents > line.lineTotalCents && (
                <s className="text-xs text-muted tabular-nums">{formatCents(line.compareAtCents)}</s>
              )}
            </div>
          </div>
          <button
            type="button"
            className="self-start text-xs text-muted underline disabled:opacity-40"
            disabled={pending}
            onClick={() => remove(line.id)}
          >
            Remove
          </button>
        </div>
      </div>

      {line.gift && (
        // Gift lines follow their parent: no controls of their own
        <div className="ml-6 flex items-center gap-3 rounded-md border border-success bg-surface p-2">
          <Thumb image={line.gift.image} alt="" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-semibold text-success">FREE GIFT</span>
            <span className="text-sm">
              {line.gift.quantity} × {line.gift.title}
            </span>
          </div>
          <span className="text-sm font-semibold text-success">Free</span>
        </div>
      )}
    </li>
  );
}

/** The order bump: one checkbox offer, priced by the server. */
function BumpOffer({ bump }: { bump: PricedBump }) {
  const { setBump, pending } = useCart();
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-accent bg-surface p-3">
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
        <span className="text-sm font-semibold tabular-nums">{formatCents(bump.priceCents)}</span>
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
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-surface p-0 text-text backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border px-gutter py-4">
          <h2 id="cart-title" className="font-heading text-lg font-semibold">
            Your cart {cart && cart.itemCount > 0 ? `(${cart.itemCount})` : ""}
          </h2>
          <button type="button" onClick={close} className="rounded-md px-2 py-1 text-sm hover:bg-surface-muted">
            Close
          </button>
        </header>

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
              <p className="text-muted">Your cart is empty.</p>
              <Link href="/products" onClick={close} className="text-sm underline">
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
          <footer className="flex flex-col gap-3 border-t border-border px-gutter py-4">
            {cart.bump && <BumpOffer bump={cart.bump} />}
            {freeShippingText && <p className="text-center text-sm text-muted">{freeShippingText}</p>}
            {cart.savingsCents > 0 && (
              <p className="flex justify-between text-sm text-success">
                <span>You save</span>
                <span className="tabular-nums">{formatCents(cart.savingsCents)}</span>
              </p>
            )}
            <p className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCents(cart.subtotalCents)}</span>
            </p>
            <p className="text-xs text-muted">Shipping is chosen at checkout.</p>
            <button
              type="button"
              disabled
              className="rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Checkout
            </button>
            <p className="-mt-1 text-center text-xs text-muted">Prototype: checkout arrives in the next milestone.</p>
          </footer>
        )}
      </div>
    </dialog>
  );
}
