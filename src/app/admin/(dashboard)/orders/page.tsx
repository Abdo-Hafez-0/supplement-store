import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { cn } from "@/components/ui/cn";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/money";
import { listOrders } from "@/lib/orders";
import { formatOrderDate } from "@/lib/orders/labels";

export const metadata: Metadata = { title: "Orders" };

const views = [
  { key: "to_ship", label: "To ship" },
  { key: "paid", label: "All paid" },
  { key: "pending", label: "Unpaid" },
  { key: "all", label: "Everything" },
] as const;
type View = (typeof views)[number]["key"];

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const query = await searchParams;
  const view: View = views.find((v) => v.key === query.view)?.key ?? "to_ship";
  const page = Math.min(1000, Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1));
  const { rows, hasMore } = await listOrders(getDb(), view, page);
  const href = (next: { view?: View; page?: number }) =>
    `/admin/orders?view=${next.view ?? view}${(next.page ?? 1) > 1 ? `&page=${next.page}` : ""}`;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Newest first. Open an order to mark it shipped and add the tracking number. Refunds are made in PayPal; mark
          the order refunded here afterwards.
        </p>
      </div>

      <nav aria-label="Order views" className="flex flex-wrap gap-2">
        {views.map((v) => (
          <Link
            key={v.key}
            href={href({ view: v.key })}
            aria-current={v.key === view ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              v.key === view ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface hover:bg-surface-muted",
            )}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
          {view === "to_ship" ? "Nothing to ship right now." : "No orders here yet."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {rows.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-muted sm:grid-cols-[10rem_1fr_8rem_7rem_9rem]"
              >
                <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                <span className="justify-self-end sm:order-last">
                  <OrderStatusBadge status={order.status} />
                </span>
                <span className="col-span-2 min-w-0 truncate text-sm sm:col-span-1">
                  {order.shippingName} <span className="text-muted">· {order.email}</span>
                </span>
                <span className="text-xs text-muted sm:text-sm">{formatOrderDate(order.paidAt ?? order.createdAt)}</span>
                <span className="justify-self-end text-sm font-semibold tabular-nums sm:justify-self-start">
                  {formatCents(order.totalCents)}
                  <span className="ml-1 font-normal text-muted">
                    · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-between text-sm">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={href({ page: page + 1 })} className="underline">
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
