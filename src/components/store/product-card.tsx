import Link from "next/link";
import type { ProductCardData } from "@/lib/db/queries/storefront";
import { formatCents } from "@/lib/money";
import { ImagePlaceholder, MediaImage } from "./media-image";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const image = product.images[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-surface-muted">
        {image ? (
          <MediaImage
            fileKey={image}
            alt={product.title}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="transition group-hover:scale-[1.02]"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="font-heading text-sm font-semibold sm:text-base">{product.title}</h3>
        {product.shortDescription && (
          <p className="line-clamp-2 text-xs text-muted sm:text-sm">{product.shortDescription}</p>
        )}
        <p className="mt-auto pt-2 text-sm">
          {product.fromPerBottleCents !== null ? (
            <>
              <span className="font-semibold">From {formatCents(product.fromPerBottleCents)}</span>
              <span className="text-muted"> / bottle </span>
              <s className="text-muted">{formatCents(product.regularPriceCents)}</s>
            </>
          ) : (
            <span className="font-semibold">{formatCents(product.regularPriceCents)}</span>
          )}
        </p>
        {product.stock === 0 && <p className="text-xs font-medium text-danger">Out of stock</p>}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} priority={index < 2} />
        </li>
      ))}
    </ul>
  );
}
