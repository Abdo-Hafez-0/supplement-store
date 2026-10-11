import Link from "next/link";
import { ProductGrid } from "@/components/store/product-card";
import { buttonClass } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { listStoreProducts } from "@/lib/db/queries/storefront";
import { getRequestSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const [{ home }, featured] = await Promise.all([getRequestSettings(), listStoreProducts(db, { featuredOnly: true })]);
  // Without featured products, show the first few products instead of an empty section.
  const products = featured.length ? featured : (await listStoreProducts(db)).slice(0, 4);
  const paragraphs = home.aboutText.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-page flex-col items-start gap-4 px-gutter py-12 sm:py-16">
          <h1 className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl">{home.heroTitle}</h1>
          {home.heroText && <p className="max-w-xl text-muted sm:text-lg">{home.heroText}</p>}
          <Link href="/products" className={buttonClass()}>
            Shop all products
          </Link>
        </div>
      </section>

      {products.length > 0 && (
        <section aria-labelledby="featured" className="mx-auto w-full max-w-page px-gutter py-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="featured" className="font-heading text-2xl font-semibold">
              {featured.length ? "Featured" : "Products"}
            </h2>
            <Link href="/products" className="text-sm hover:underline">
              View all
            </Link>
          </div>
          <ProductGrid products={products} />
        </section>
      )}

      {paragraphs.length > 0 && (
        <section aria-labelledby="about" className="mx-auto w-full max-w-page px-gutter py-10">
          <h2 id="about" className="mb-4 font-heading text-2xl font-semibold">
            {home.aboutTitle || "About us"}
          </h2>
          <div className="flex max-w-prose flex-col gap-3 text-muted">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {home.faq.length > 0 && (
        <section aria-labelledby="faq-title" id="faq" className="mx-auto w-full max-w-page scroll-mt-20 px-gutter py-10">
          <h2 id="faq-title" className="mb-4 font-heading text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="flex max-w-3xl flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {home.faq.map((item, index) => (
              <details key={index} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.question}
                  <span aria-hidden className="text-muted transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 whitespace-pre-line text-sm text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
