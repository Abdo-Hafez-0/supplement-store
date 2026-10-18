import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/money";
import { adminOrderStatuses, getOrderById, type AdminOrderStatus } from "@/lib/orders";
import { formatOrderDate } from "@/lib/orders/labels";
import { formatUsPhone } from "@/lib/validation/checkout";
import { saveFulfillment } from "../actions";
import { FulfillmentForm } from "./fulfillment-form";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  const order = await getOrderById(getDb(), Number(id));
  if (!order) notFound();

  const editable = (adminOrderStatuses as readonly string[]).includes(order.status);
  const paidItems = order.items.filter((item) => !item.isGift);
  const giftsFor = (itemId: number) => order.items.filter((item) => item.isGift && item.parentItemId === itemId);
  const timeline = [
    { label: "Placed", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: "Shipped", at: order.shippedAt },
    { label: "Refunded", at: order.refundedAt },
  ].filter((step): step is { label: string; at: Date } => step.at !== null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/orders" className="text-sm text-muted hover:underline">
          ← Orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
          {order.paypalOrderId.startsWith("TEST-") && <Badge tone="outline">Test order</Badge>}
        </div>
        <p className="text-sm text-muted">
          {timeline.map((step) => `${step.label} ${formatOrderDate(step.at)}`).join(" · ")}
        </p>
      </div>

      {editable ? (
        <Card title="Fulfillment">
          <FulfillmentForm
            status={order.status as AdminOrderStatus}
            trackingNumber={order.trackingNumber}
            action={saveFulfillment.bind(null, order.id)}
          />
        </Card>
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {order.status === "pending"
            ? "The customer hasn't paid yet. This order can be shipped once payment is confirmed."
            : "The payment for this order didn't go through. Nothing needs to be shipped."}
        </p>
      )}

      <Card title="Items">
        <ul className="flex flex-col divide-y divide-border text-sm">
          {paidItems.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3">
              <div className="flex justify-between gap-3">
                <span>
                  <span className="font-semibold">{item.quantity} ×</span> {item.productName}
                  {item.isBump && (
                    <Badge tone="outline" className="ml-2">
                      Order bump
                    </Badge>
                  )}
                  <span className="block text-xs text-muted">
                    {formatCents(item.unitPriceCents)} each (price at purchase)
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{formatCents(item.lineTotalCents)}</span>
              </div>
              {giftsFor(item.id).map((gift) => (
                <div key={gift.id} className="ml-4 flex justify-between gap-3">
                  <span>
                    <Badge tone="gift" className="mr-2">
                      Free gift
                    </Badge>
                    {gift.quantity} × {gift.productName}
                  </span>
                  <span className="text-muted">Free</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
        <dl className="mt-2 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping ({order.shippingMethodName})</dt>
            <dd className="tabular-nums">{order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Ship to">
          <address className="text-sm not-italic leading-relaxed">
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
            <br />
            United States
          </address>
        </Card>
        <Card title="Customer">
          <p className="text-sm">
            <a href={`mailto:${order.email}`} className="underline">
              {order.email}
            </a>
          </p>
          <p className="text-sm">
            <a href={`tel:+1${order.phone}`} className="underline">
              {formatUsPhone(order.phone)}
            </a>
          </p>
        </Card>
      </div>

      <Card title="Payment">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">PayPal order</dt>
          <dd className="font-mono break-all">{order.paypalOrderId}</dd>
          <dt className="text-muted">Capture</dt>
          <dd className="font-mono break-all">{order.paypalCaptureId ?? "—"}</dd>
        </dl>
        <p className="mt-3 text-sm">
          <Link href={`/api/admin/orders/${order.id}/email-preview`} target="_blank" className="underline">
            Preview the customer&apos;s confirmation email
          </Link>
          {" · "}
          <Link href={`/api/admin/orders/${order.id}/email-preview?type=alert`} target="_blank" className="underline">
            Preview your new-order alert
          </Link>
        </p>
      </Card>
    </>
  );
}
