import type { Metadata } from "next";
import { ProductGrid } from "@/components/store/product-card";
import { getDb } from "@/lib/db/client";
import { listStoreProducts } from "@/lib/db/queries/storefront";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop all products" };

export default async function ProductsPage() {
  const products = await listStoreProducts(getDb());
  return (
    <section className="mx-auto w-full max-w-page px-gutter py-8 sm:py-12">
      <div className="mb-6 flex flex-col gap-2">
        <span aria-hidden className="h-1 w-12 rounded-full bg-highlight" />
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">All products</h1>
      </div>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-muted">No products yet. Please check back soon.</p>
      )}
    </section>
  );
}
