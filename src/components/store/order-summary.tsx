import { Badge } from "@/components/ui/badge";
import { GiftIcon } from "@/components/ui/icons";
import type { PricedCart } from "@/lib/pricing";
import { formatCents } from "@/lib/money";
import { ImagePlaceholder, MediaImage } from "./media-image";

function Thumb({ image, quantity }: { image: string | null; quantity: number }) {
  return (
    <div className="relative size-14 shrink-0">
      <div className="size-14 overflow-hidden rounded-md border border-border bg-surface-muted">
        {image ? <MediaImage fileKey={image} alt="" sizes="56px" /> : <ImagePlaceholder />}
      </div>
      <span className="absolute -top-2 -right-2 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
        {quantity}
      </span>
    </div>
  );
}

/** The cart as the server priced it, with optional shipping and total rows. */
export function OrderSummary({
  cart,
  shippingCents,
  shippingLabel,
}: {
  cart: PricedCart;
  /** null: not chosen yet */
  shippingCents: number | null;
  shippingLabel?: string;
}) {
  const bump = cart.bump?.accepted ? cart.bump : null;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Thumb image={line.image} quantity={line.quantity} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">{line.title}</span>
                {line.tierBottles !== null && line.tierBottles > 1 && (
                  <span className="text-xs text-muted">{line.tierBottles}-bottle bundle price</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{formatCents(line.lineTotalCents)}</p>
                {line.compareAtCents > line.lineTotalCents && (
                  <s className="text-xs text-muted tabular-nums">{formatCents(line.compareAtCents)}</s>
                )}
              </div>
            </div>
            {line.gift && (
              <div className="ml-6 flex items-center gap-3 rounded-lg border border-highlight bg-highlight-soft p-2">
                <Thumb image={line.gift.image} quantity={line.gift.quantity} />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <Badge tone="highlight">
                    <GiftIcon className="size-3.5" />
                    FREE GIFT
                  </Badge>
                  <span className="text-sm">{line.gift.title}</span>
                </div>
                <span className="pr-1 text-sm font-bold text-highlight-text">Free</span>
              </div>
            )}
          </li>
        ))}
        {bump && (
          <li className="flex items-center gap-3">
            <Thumb image={bump.image} quantity={1} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">{bump.title}</span>
              <span className="text-xs text-muted">Special offer</span>
            </div>
            <span className="text-sm font-bold tabular-nums">{formatCents(bump.priceCents)}</span>
          </li>
        )}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        {cart.savingsCents > 0 && (
          <div className="flex justify-between font-semibold text-success">
            <dt>You save</dt>
            <dd className="tabular-nums">{formatCents(cart.savingsCents)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatCents(cart.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping{shippingLabel ? ` (${shippingLabel})` : ""}</dt>
          <dd className="tabular-nums">
            {shippingCents === null ? "Choose below" : shippingCents === 0 ? "Free" : formatCents(shippingCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3 text-lg font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">
            <span className="mr-1 text-xs font-normal text-muted">USD</span>
            {formatCents(cart.subtotalCents + (shippingCents ?? 0))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
