import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/lib/db/queries/storefront";
import { formatCents } from "@/lib/money";
import { ImagePlaceholder, MediaImage } from "./media-image";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const image = product.images[0];
  const fromCents = product.fromPerBottleCents;
  // Display only: the best bundle's per-bottle saving against the regular price
  const savePercent =
    fromCents !== null && product.regularPriceCents > 0
      ? Math.round((1 - fromCents / product.regularPriceCents) * 100)
      : 0;
  const soldOut = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-raised"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {image ? (
          <MediaImage
            fileKey={image}
            alt={product.title}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {soldOut ? (
          <Badge tone="neutral" className="absolute top-2 left-2">
            Out of stock
          </Badge>
        ) : (
          savePercent > 0 && (
            <Badge tone="highlight" className="absolute top-2 left-2">
              Save up to {savePercent}%
            </Badge>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="font-heading text-sm leading-snug font-semibold sm:text-base">{product.title}</h3>
        {product.shortDescription && (
          <p className="line-clamp-2 text-xs text-muted sm:text-sm">{product.shortDescription}</p>
        )}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-2 text-sm">
          {fromCents !== null ? (
            <>
              <span className="text-xs text-muted">From</span>
              <span className="text-base font-bold text-accent tabular-nums">{formatCents(fromCents)}</span>
              <span className="text-xs text-muted">/ bottle</span>
              <s className="text-xs text-muted tabular-nums">{formatCents(product.regularPriceCents)}</s>
            </>
          ) : (
            <span className="text-base font-bold text-accent tabular-nums">{formatCents(product.regularPriceCents)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} priority={index < 2} />
        </li>
      ))}
    </ul>
  );
}
