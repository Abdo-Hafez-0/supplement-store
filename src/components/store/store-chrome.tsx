import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import type { Settings } from "@/lib/settings/schema";
import { CartButton } from "./cart-drawer";

export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-inverse px-gutter py-2 text-center text-xs font-medium text-inverse-foreground sm:text-sm">
      {text}
    </div>
  );
}

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-gutter">
        <Link href="/" aria-label="DRIVEX home" className="shrink-0">
          <Logo className="h-7 sm:h-8" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/products" className="rounded-md px-2 py-2 hover:text-accent">
            Shop
          </Link>
          <Link href="/#faq" className="rounded-md px-2 py-2 hover:text-accent">
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
    <footer className="mt-section bg-inverse text-inverse-foreground">
      <div className="mx-auto grid w-full max-w-page gap-8 px-gutter py-12 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Logo tone="inverse" className="h-8 self-start" />
          <nav aria-label="Footer" className="flex gap-5 text-inverse-muted">
            <Link href="/products" className="hover:text-inverse-foreground">
              Shop
            </Link>
            <Link href="/#faq" className="hover:text-inverse-foreground">
              FAQ
            </Link>
          </nav>
        </div>
        {contacts.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {contacts.map((item) => (
              <div key={item.label} className="contents">
                <dt className="text-inverse-muted">{item.label}</dt>
                <dd>
                  {item.href ? (
                    <a href={item.href} className="underline-offset-2 hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="border-t border-inverse-border">
        <p className="mx-auto w-full max-w-page px-gutter py-5 text-xs text-inverse-muted">
          These statements have not been evaluated by the Food and Drug Administration. These products are not intended
          to diagnose, treat, cure, or prevent any disease.
        </p>
        <p className="mx-auto w-full max-w-page px-gutter pb-6 text-xs text-inverse-muted">
          © {new Date().getFullYear()} DRIVEX
        </p>
      </div>
    </footer>
  );
}
