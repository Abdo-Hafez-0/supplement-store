import type { ReactNode } from "react";
import { CartProvider } from "@/components/store/cart-context";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AnnouncementBar, StoreFooter, StoreHeader } from "@/components/store/store-chrome";
import { getRequestSettings } from "@/lib/settings";

// Store pages read products and settings from D1 on each request.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getRequestSettings();
  return (
    <CartProvider freeShippingText={settings.storefront.freeShippingText}>
      <AnnouncementBar text={settings.storefront.announcementText} />
      <StoreHeader />
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <StoreFooter home={settings.home} />
      <CartDrawer />
    </CartProvider>
  );
}
