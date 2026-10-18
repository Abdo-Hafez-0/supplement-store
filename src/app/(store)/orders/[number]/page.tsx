import type { Metadata } from "next";
import Link from "next/link";
import { OrderLookupForm } from "@/components/store/order-lookup-form";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { CheckIcon, GiftIcon, TruckIcon } from "@/components/ui/icons";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/money";
import { getOrderByNumber, ORDER_NUMBER_PATTERN } from "@/lib/orders";
import { hasOrderAccess } from "@/lib/orders/access";
import { customerStatusLabels, formatOrderDate } from "@/lib/orders/labels";
import { formatUsPhone } from "@/lib/validation/checkout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[number]">) {
  const { number } = await params;
  const { placed } = await searchParams;
  const orderNumber = number.toUpperCase();
  const order =
    ORDER_NUMBER_PATTERN.test(orderNumber) && (await hasOrderAccess(orderNumber))
      ? await getOrderByNumber(getDb(), orderNumber)
      : null;

  // Without access (another browser, or a wrong number), ask for the email first
  if (!order) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 px-gutter py-10">
        <h1 className="font-heading text-3xl font-bold">Find your order</h1>
        <p className="text-muted">To protect your details, enter the email you used at checkout.</p>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <OrderLookupForm orderNumber={ORDER_NUMBER_PATTERN.test(orderNumber) ? orderNumber : ""} />
        </div>
      </section>
    );
  }

  const justPlaced = placed === "1" && order.status === "paid";
  const paidItems = order.items.filter((item) => !item.isGift);
  const giftsFor = (itemId: number) => order.items.filter((item) => item.isGift && item.parentItemId === itemId);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-gutter py-8 sm:py-12">
      {justPlaced ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-inverse px-5 py-8 text-center text-inverse-foreground">
          <span className="flex size-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground">
            <CheckIcon className="size-7" />
          </span>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Thank you for your order!</h1>
          <p className="text-inverse-muted">
            Order <strong className="text-inverse-foreground">{order.orderNumber}</strong> is confirmed. Keep this
            number to check your order&apos;s status later.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed {formatOrderDate(order.createdAt)}</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
        <TruckIcon className="size-6 text-accent" />
        <div className="flex flex-col">
          <span className="text-sm text-muted">Status</span>
          <span className="font-semibold">{customerStatusLabels[order.status]}</span>
          {order.trackingNumber && (
            <span className="text-sm">
              Tracking number: <span className="font-mono font-semibold">{order.trackingNumber}</span>
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5">
        <h2 className="mb-3 font-heading text-lg font-bold">Items</h2>
        <ul className="flex flex-col divide-y divide-border">
          {paidItems.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3">
              <div className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="font-semibold">{item.quantity} ×</span> {item.productName}
                  {item.isBump && <span className="text-muted"> (special offer)</span>}
                </span>
                <span className="font-semibold tabular-nums">{formatCents(item.lineTotalCents)}</span>
              </div>
              {giftsFor(item.id).map((gift) => (
                <div key={gift.id} className="ml-4 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge tone="highlight">
                      <GiftIcon className="size-3.5" />
                      FREE GIFT
                    </Badge>
                    {gift.quantity} × {gift.productName}
                  </span>
                  <span className="font-semibold text-highlight-text">Free</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
        <dl className="mt-2 flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping ({order.shippingMethodName})</dt>
            <dd className="tabular-nums">{order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4 text-sm shadow-card">
          <h2 className="mb-2 font-heading font-bold">Shipping to</h2>
          <address className="not-italic leading-relaxed">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 && (
              <>
                <br />
                {order.shippingLine2}
              </>
            )}
            <br />
            {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
          </address>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm shadow-card">
          <h2 className="mb-2 font-heading font-bold">Contact</h2>
          <p>{order.email}</p>
          <p>{formatUsPhone(order.phone)}</p>
        </div>
      </div>

      <Link href="/products" className={buttonClass("secondary", "md") + " self-center"}>
        Continue shopping
      </Link>
    </section>
  );
}
