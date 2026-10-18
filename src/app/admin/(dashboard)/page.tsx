import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { orders, products, shippingMethods } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const db = getDb();
  const [byStatus, [shipping], [toShip]] = await Promise.all([
    db.select({ status: products.status, value: count() }).from(products).groupBy(products.status),
    db.select({ value: count() }).from(shippingMethods).where(eq(shippingMethods.isActive, true)),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "paid")),
  ]);
  const total = (status: string) => byStatus.find((row) => row.status === status)?.value ?? 0;

  const stats: { label: string; value: number; href?: string }[] = [
    { label: "Orders to ship", value: toShip?.value ?? 0, href: "/admin/orders" },
    { label: "Active products", value: total("active") },
    { label: "Unlisted (gifts, bumps)", value: total("unlisted") },
    { label: "Drafts", value: total("draft") },
    { label: "Active shipping methods", value: shipping?.value ?? 0 },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <Link href="/admin/products/new" className={buttonClass()}>
          Add product
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="relative rounded-lg border border-border bg-surface p-4">
            <dt className="text-sm text-muted">
              {stat.href ? (
                <Link href={stat.href} className="after:absolute after:inset-0 hover:underline">
                  {stat.label}
                </Link>
              ) : (
                stat.label
              )}
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <Card title="Getting started">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Add gift products first (status <strong>Unlisted</strong>), so tiers can offer them.
          </li>
          <li>Add each product with its images, then its tiers, gifts and order bump.</li>
          <li>
            Set up at least one <Link href="/admin/shipping" className="underline">shipping method</Link>.
          </li>
          <li>
            Fill in banner texts, the timer and the how-to video in{" "}
            <Link href="/admin/settings" className="underline">settings</Link>.
          </li>
        </ol>
      </Card>
    </>
  );
}
