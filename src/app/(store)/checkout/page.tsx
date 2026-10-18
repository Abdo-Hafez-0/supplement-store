import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getPricedCart, readCartId } from "@/lib/cart";
import { activeShippingOptions } from "@/lib/checkout";
import { getDb } from "@/lib/db/client";
import { getRequestSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const db = getDb();
  const settings = await getRequestSettings();
  const [cart, shippingOptions] = await Promise.all([
    getPricedCart(db, await readCartId(), settings),
    activeShippingOptions(db),
  ]);
  const { cartId: _id, ...initialCart } = cart;
  void _id;

  return (
    <section className="mx-auto w-full max-w-page px-gutter py-6 sm:py-10">
      <h1 className="mb-5 font-heading text-3xl font-bold">Checkout</h1>
      <CheckoutForm
        initialCart={initialCart}
        shippingOptions={shippingOptions}
        trustBadges={settings.storefront.trustBadges}
      />
    </section>
  );
}
