import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { getProductForAdmin, listProductOptions } from "@/lib/db/queries/admin-products";
import { MAX_REVIEW_IMAGES } from "@/lib/validation/admin";
import {
  addReviewImage,
  deleteOrderBump,
  deleteProduct,
  deleteReviewImage,
  reorderReviewImages,
  saveOrderBump,
  saveProduct,
  saveTiers,
  updateReviewImageAlt,
} from "../actions";
import { ProductForm } from "../product-form";
import { DeleteProduct } from "./delete-product";
import { OrderBumpForm } from "./order-bump-form";
import { ReviewImages } from "./review-images";
import { TierEditor } from "./tier-editor";
import { tierRowsFromDb } from "./tier-rows";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id: rawId } = await params;
  const { created } = await searchParams;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const db = getDb();
  const [data, productOptions] = await Promise.all([getProductForAdmin(db, id), listProductOptions(db)]);
  if (!data) notFound();
  const { product, tiers, bump, reviewImages } = data;
  const others = productOptions.filter((option) => option.id !== id);

  return (
    <>
      <div>
        <Link href="/admin/products" className="text-sm text-muted hover:underline">
          ← Products
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <StatusBadge status={product.status} />
        </div>
        {created && <p className="mt-2 text-sm text-success">Product created. Add its tiers, gifts and bump below.</p>}
      </div>

      <Card title="Details">
        <ProductForm
          initial={product}
          action={saveProduct.bind(null, id)}
          isNew={false}
        />
      </Card>

      <Card
        title="Tiers and gifts"
        description="Bundle prices by bottle count. The cart uses the tier matching the real quantity. Gifts default to bottles − 1; when a gift is out of stock its substitute is used."
      >
        <TierEditor
          initial={tierRowsFromDb(tiers)}
          regularPriceCents={product.regularPriceCents}
          productOptions={productOptions}
          action={saveTiers.bind(null, id)}
        />
      </Card>

      <Card
        title="Order bump"
        description="A checkbox offer at checkout when this product is in the cart. If several products in the cart have bumps, the most expensive product's bump is shown."
      >
        {others.length === 0 ? (
          <p className="text-sm text-muted">Add another product first; the bump offers a different product.</p>
        ) : (
          <OrderBumpForm
            productId={id}
            initial={bump}
            productOptions={productOptions}
            saveAction={saveOrderBump.bind(null, id)}
            deleteAction={deleteOrderBump.bind(null, id)}
          />
        )}
      </Card>

      <Card title="Review images" description={`Customer review screenshots for the carousel, up to ${MAX_REVIEW_IMAGES}.`}>
        <ReviewImages
          images={reviewImages}
          addAction={addReviewImage.bind(null, id)}
          updateAltAction={updateReviewImageAlt}
          reorderAction={reorderReviewImages.bind(null, id)}
          deleteAction={deleteReviewImage}
        />
      </Card>

      <Card title="Delete product" description="Products used as a gift, substitute or bump elsewhere can't be deleted. Set them to Draft instead.">
        <DeleteProduct title={product.title} action={deleteProduct.bind(null, id)} />
      </Card>
    </>
  );
}
