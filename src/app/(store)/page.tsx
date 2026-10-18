import Link from "next/link";
import { ProductGrid } from "@/components/store/product-card";
import { TrustBadges } from "@/components/store/trust-badges";
import { buttonClass } from "@/components/ui/button";
import { ArrowRightIcon, ChevronDownIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { getDb } from "@/lib/db/client";
import { listStoreProducts } from "@/lib/db/queries/storefront";
import { getRequestSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const [{ home, storefront }, featured] = await Promise.all([
    getRequestSettings(),
    listStoreProducts(db, { featuredOnly: true }),
  ]);
  // Without featured products, show the first few products instead of an empty section.
  const products = featured.length ? featured : (await listStoreProducts(db)).slice(0, 4);
  const paragraphs = home.aboutText.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <>
      <section className="relative overflow-hidden bg-inverse text-inverse-foreground">
        {/* The DX mark as a large, faint watermark behind the headline */}
        <Logo
          variant="mark"
          tone="inverse"
          decorative
          className="pointer-events-none absolute -right-16 -bottom-6 h-56 opacity-10 sm:h-80 md:right-0"
        />
        <div className="relative mx-auto flex w-full max-w-page flex-col items-start gap-5 px-gutter py-14 sm:py-20">
          <h1 className="max-w-2xl font-heading text-3xl leading-tight font-bold sm:text-5xl">{home.heroTitle}</h1>
          {home.heroText && <p className="max-w-xl text-base text-inverse-muted sm:text-lg">{home.heroText}</p>}
          <Link href="/products" className={buttonClass("highlight", "lg")}>
            Shop all products
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {storefront.trustBadges.length > 0 && (
        <div className="border-b border-border bg-surface">
          <TrustBadges badges={storefront.trustBadges} className="mx-auto w-full max-w-page px-gutter py-4" />
        </div>
      )}

      {products.length > 0 && (
        <section aria-labelledby="featured" className="mx-auto w-full max-w-page px-gutter py-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="featured" className="font-heading text-2xl font-bold sm:text-3xl">
              {featured.length ? "Featured" : "Products"}
            </h2>
            <Link href="/products" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <ProductGrid products={products} />
        </section>
      )}

      {paragraphs.length > 0 && (
        <section aria-labelledby="about" className="bg-surface">
          <div className="mx-auto grid w-full max-w-page gap-6 px-gutter py-12 md:grid-cols-[1fr_2fr] md:gap-12">
            <div className="flex flex-col gap-3">
              <span aria-hidden className="h-1 w-12 rounded-full bg-highlight" />
              <h2 id="about" className="font-heading text-2xl font-bold sm:text-3xl">
                {home.aboutTitle || "About us"}
              </h2>
            </div>
            <div className="flex max-w-prose flex-col gap-3 text-muted sm:text-lg">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {home.faq.length > 0 && (
        <section aria-labelledby="faq-title" id="faq" className="mx-auto w-full max-w-page scroll-mt-20 px-gutter py-12">
          <h2 id="faq-title" className="mb-5 font-heading text-2xl font-bold sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="flex max-w-3xl flex-col gap-3">
            {home.faq.map((item, index) => (
              <details key={index} className="group rounded-lg border border-border bg-surface shadow-card open:ring-1 open:ring-accent">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDownIcon className="size-5 text-accent transition group-open:rotate-180" />
                </summary>
                <p className="-mt-1 px-4 pb-4 whitespace-pre-line text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
