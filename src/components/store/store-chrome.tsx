import Link from "next/link";
import type { Settings } from "@/lib/settings/schema";
import { CartButton } from "./cart-drawer";

export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-accent px-gutter py-2 text-center text-xs font-medium text-accent-foreground sm:text-sm">
      {text}
    </div>
  );
}

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between gap-4 px-gutter">
        <Link href="/" className="font-heading text-lg font-semibold">
          Supplement Store
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <Link href="/#faq" className="hover:underline">
            FAQ
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter({ home }: { home: Settings["home"] }) {
  const contacts = [
    home.contactEmail && { label: "Email", value: home.contactEmail, href: `mailto:${home.contactEmail}` },
    home.contactPhone && { label: "Phone", value: home.contactPhone, href: `tel:${home.contactPhone.replace(/[^\d+]/g, "")}` },
    home.contactAddress && { label: "Address", value: home.contactAddress },
    home.contactHours && { label: "Hours", value: home.contactHours },
  ].filter((item): item is { label: string; value: string; href?: string } => Boolean(item));

  return (
    <footer className="mt-section border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-page gap-6 px-gutter py-10 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="font-heading font-semibold">Supplement Store</p>
          <nav aria-label="Footer" className="flex gap-4 text-muted">
            <Link href="/products" className="hover:underline">
              Shop
            </Link>
            <Link href="/#faq" className="hover:underline">
              FAQ
            </Link>
          </nav>
        </div>
        {contacts.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {contacts.map((item) => (
              <div key={item.label} className="contents">
                <dt className="text-muted">{item.label}</dt>
                <dd>{item.href ? <a href={item.href} className="hover:underline">{item.value}</a> : item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <p className="border-t border-border px-gutter py-4 text-center text-xs text-muted">
        These statements have not been evaluated by the Food and Drug Administration. These products are not intended
        to diagnose, treat, cure, or prevent any disease.
      </p>
    </footer>
  );
}
