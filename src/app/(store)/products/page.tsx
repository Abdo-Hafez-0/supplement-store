import type { Metadata } from "next";
import { ProductGrid } from "@/components/store/product-card";
import { getDb } from "@/lib/db/client";
import { listStoreProducts } from "@/lib/db/queries/storefront";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop all products" };

export default async function ProductsPage() {
  const products = await listStoreProducts(getDb());
  return (
    <section className="mx-auto w-full max-w-page px-gutter py-8">
      <h1 className="mb-6 font-heading text-3xl font-semibold">All products</h1>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-muted">No products yet. Please check back soon.</p>
      )}
    </section>
  );
}
