import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { MediaThumb } from "@/components/admin/media-thumb";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { listProductsForAdmin } from "@/lib/db/queries/admin-products";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireAdmin();
  const rows = await listProductsForAdmin(getDb());

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className={buttonClass()}>
          Add product
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No products yet. Start with any gift products, then the products that offer them.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Regular price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Tiers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <MediaThumb fileKey={product.images[0]} alt="" size="sm" />
                      <span className="font-medium">
                        {product.title}
                        {product.isFeatured && <span className="ml-2 text-xs text-muted">Featured</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCents(product.regularPriceCents)}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${product.stock === 0 ? "text-danger" : ""}`}
                  >
                    {product.stock}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{product.tierCount || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
