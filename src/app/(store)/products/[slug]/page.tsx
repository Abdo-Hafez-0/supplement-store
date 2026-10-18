import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { OfferTimer } from "@/components/store/offer-timer";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { ReviewCarousel } from "@/components/store/review-carousel";
import { TrustBadges } from "@/components/store/trust-badges";
import { TruckIcon } from "@/components/ui/icons";
import { getDb } from "@/lib/db/client";
import { getStoreProduct } from "@/lib/db/queries/storefront";
import { formatCents } from "@/lib/money";
import { getRequestSettings } from "@/lib/settings";
import { offerActive } from "@/lib/timer";
import { getVisitorTimer } from "@/lib/timer/server";

export const dynamic = "force-dynamic";

const loadProduct = cache((slug: string) => getStoreProduct(getDb(), slug));

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const data = await loadProduct((await params).slug);
  if (!data) return {};
  const { product } = data;
  return {
    title: product.title,
    description: product.shortDescription || undefined,
    openGraph: product.images[0] ? { images: [`/media/${product.images[0]}`] } : undefined,
    // Unlisted products (gifts, bumps) open by link but stay out of search results
    robots: product.status === "unlisted" ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([loadProduct(slug), getRequestSettings()]);
  if (!data) notFound();
  const { product, tiers, reviews } = data;
  const { state: timer } = await getVisitorTimer(settings.timer);
  const active = offerActive(timer);
  const { storefront, video } = settings;
  const descriptionParagraphs = product.description.split(/\n\s*\n/).filter((p) => p.trim());
  const hasGift = tiers.some((tier) => tier.gift !== null);
  const banner = [storefront.promoBannerText, hasGift ? storefront.promoGiftText : ""].filter(Boolean).join(" ");

  return (
    <>
      {banner && (
        <div className="bg-highlight px-gutter py-2 text-center text-sm font-bold text-highlight-foreground">{banner}</div>
      )}

      <div className="mx-auto grid w-full max-w-page gap-6 px-gutter py-6 md:grid-cols-2 md:gap-10 md:py-10">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl leading-tight font-bold sm:text-4xl">{product.title}</h1>
            {product.shortDescription && <p className="text-muted">{product.shortDescription}</p>}
            {tiers.length > 0 && active && (
              <p className="text-sm text-muted">
                Regular price <s>{formatCents(product.regularPriceCents)}</s> per bottle
              </p>
            )}
          </div>

          <OfferTimer initial={timer} />

          <PurchasePanel
            productId={product.id}
            tiers={tiers}
            regularPriceCents={product.regularPriceCents}
            offerActive={active}
            giftBadgeText={storefront.giftBadgeText}
            stock={product.stock}
            maxQuantity={settings.limits.maxQuantityPerLine}
          />

          {storefront.freeShippingText && (
            <p className="flex items-center gap-3 rounded-lg bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
              <TruckIcon />
              {storefront.freeShippingText}
            </p>
          )}

          <TrustBadges badges={storefront.trustBadges} className="sm:justify-start" />
        </div>
      </div>

      {descriptionParagraphs.length > 0 && (
        <section aria-labelledby="description" className="mx-auto w-full max-w-page px-gutter py-8">
          <h2 id="description" className="mb-4 font-heading text-2xl font-bold">
            Description
          </h2>
          <div className="flex max-w-prose flex-col gap-3 text-muted">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {video.fileKey && (
        <section aria-labelledby="video" className="mx-auto w-full max-w-page px-gutter py-8">
          <h2 id="video" className="mb-4 font-heading text-2xl font-bold">
            {video.title || "How to use"}
          </h2>
          <video
            src={`/media/${video.fileKey}`}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full max-w-3xl rounded-lg bg-black shadow-card"
          />
        </section>
      )}

      {reviews.length > 0 && (
        <section aria-labelledby="reviews" className="mx-auto w-full max-w-page px-gutter py-8">
          <h2 id="reviews" className="mb-4 font-heading text-2xl font-bold">
            What customers say
          </h2>
          <ReviewCarousel reviews={reviews} />
        </section>
      )}
    </>
  );
}
