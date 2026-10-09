import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { saveProduct } from "../actions";
import { emptyProduct, ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <div>
        <Link href="/admin/products" className="text-sm text-muted hover:underline">
          ← Products
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">New product</h1>
      </div>
      <Card description="Tiers, gifts, the order bump and review images can be added after the product is created.">
        <ProductForm initial={emptyProduct} action={saveProduct.bind(null, null)} isNew />
      </Card>
    </>
  );
}
