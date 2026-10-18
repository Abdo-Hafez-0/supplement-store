"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, Input, Select } from "@/components/ui/field";
import { ChevronDownIcon, ShieldIcon } from "@/components/ui/icons";
import { formatCents } from "@/lib/money";
import { shippingCentsFor, type ShippingOption } from "@/lib/orders/snapshot";
import type { PricedCart } from "@/lib/pricing";
import type { CheckoutField } from "@/lib/validation/checkout";
import { US_STATES } from "@/lib/validation/us-states";
import { BumpOffer } from "./cart-drawer";
import { useCart } from "./cart-context";
import { OrderSummary } from "./order-summary";
import { TrustBadges } from "./trust-badges";

type Details = Record<Exclude<CheckoutField, "shippingMethodId">, string>;

type Quote = {
  totals: { subtotalCents: number; shippingCents: number; totalCents: number };
  paymentsConnected: boolean;
  testOrdersAllowed: boolean;
};

// 16 px text so iPhones don't zoom into fields on focus
const inputClass = "py-3 text-base";

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5">
      <h2 className="flex items-center gap-3 font-heading text-lg font-bold">
        <span className="flex size-7 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({
  initialCart,
  shippingOptions,
  trustBadges,
}: {
  initialCart: PricedCart;
  shippingOptions: ShippingOption[];
  trustBadges: string[];
}) {
  const router = useRouter();
  const { cart: liveCart, pending: cartPending, refresh: refreshCart } = useCart();
  // The cart context loads the same server cart; until then, use the page's copy
  const cart = liveCart ?? initialCart;

  const [details, setDetails] = useState<Details>({
    email: "",
    phone: "",
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [methodId, setMethodId] = useState<number | null>(shippingOptions[0]?.id ?? null);
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedQuote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  const method = shippingOptions.find((option) => option.id === methodId) ?? null;
  // A quote is for the cart it priced: ticking the bump (or any cart change) needs a new one
  const quote = savedQuote && savedQuote.totals.subtotalCents === cart.subtotalCents ? savedQuote : null;
  // Display only: the server prices shipping again in the quote
  const shippingCents = method ? shippingCentsFor(method, cart.subtotalCents) : null;
  const totalCents = cart.subtotalCents + (shippingCents ?? 0);

  const set = (field: keyof Details) => (event: { currentTarget: { value: string } }) => {
    const value = event.currentTarget.value;
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setQuote(null); // details changed: confirm them again before paying
  };
  const body = () => JSON.stringify({ ...details, shippingMethodId: methodId ?? 0 });

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body(),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<Quote> & {
        error?: string;
        fieldErrors?: Partial<Record<CheckoutField, string>>;
        reason?: string;
      };
      if (!response.ok) {
        setErrors(data.fieldErrors ?? {});
        setFormError(data.error ?? "Something went wrong. Please try again.");
        // The cart was corrected on the server: show the new version
        if (data.reason === "cart_changed" || data.reason === "empty_cart") router.refresh();
        return;
      }
      setErrors({});
      setQuote(data as Quote);
    } catch {
      setFormError("We couldn't reach the store. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function placeTestOrder() {
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch("/api/checkout/test-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body(),
      });
      const data = (await response.json().catch(() => ({}))) as { orderNumber?: string; error?: string };
      if (!response.ok || !data.orderNumber) {
        setFormError(data.error ?? "The test order failed.");
        return;
      }
      router.push(`/orders/${data.orderNumber}?placed=1`);
      // The order emptied the cart on the server; update the header's count too.
      // After navigating, so the form doesn't flash "Your cart is empty" first.
      void refreshCart();
    } finally {
      setBusy(false);
    }
  }

  if (!cart.lines.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-10 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/products" className={buttonClass("primary", "md")}>
          Shop products
        </Link>
      </div>
    );
  }

  const error = (field: CheckoutField) => errors[field];
  const summary = (
    <OrderSummary cart={cart} shippingCents={shippingCents} shippingLabel={method?.name} />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-10">
      {/* On phones the summary folds into one row at the top */}
      <details className="group rounded-lg border border-border bg-surface shadow-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-accent">
            Order summary
            <ChevronDownIcon className="size-4 transition group-open:rotate-180" />
          </span>
          <span className="tabular-nums">{formatCents(totalCents)}</span>
        </summary>
        <div className="border-t border-border p-4">{summary}</div>
      </details>

      <form onSubmit={onContinue} noValidate className="flex flex-col gap-5" aria-busy={busy}>
        <Section step={1} title="Contact">
          <Field label="Email" htmlFor="email" error={error("email")} hint="For your order confirmation.">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              maxLength={254}
              value={details.email}
              onChange={set("email")}
              aria-invalid={Boolean(error("email"))}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor="phone" error={error("phone")} hint="In case the carrier needs to reach you.">
            <Input
              id="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              required
              maxLength={20}
              placeholder="(555) 555-5555"
              value={details.phone}
              onChange={set("phone")}
              aria-invalid={Boolean(error("phone"))}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section step={2} title="Shipping address">
          <Field label="Full name" htmlFor="name" error={error("name")}>
            <Input id="name" autoComplete="name" required maxLength={100} value={details.name} onChange={set("name")} aria-invalid={Boolean(error("name"))} className={inputClass} />
          </Field>
          <Field label="Street address" htmlFor="line1" error={error("line1")}>
            <Input id="line1" autoComplete="address-line1" required maxLength={200} value={details.line1} onChange={set("line1")} aria-invalid={Boolean(error("line1"))} className={inputClass} />
          </Field>
          <Field label="Apartment, suite, etc. (optional)" htmlFor="line2" error={error("line2")}>
            <Input id="line2" autoComplete="address-line2" maxLength={200} value={details.line2} onChange={set("line2")} className={inputClass} />
          </Field>
          <Field label="City" htmlFor="city" error={error("city")}>
            <Input id="city" autoComplete="address-level2" required maxLength={100} value={details.city} onChange={set("city")} aria-invalid={Boolean(error("city"))} className={inputClass} />
          </Field>
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            <Field label="State" htmlFor="state" error={error("state")}>
              <Select id="state" autoComplete="address-level1" required value={details.state} onChange={set("state")} aria-invalid={Boolean(error("state"))} className={inputClass}>
                <option value="" disabled>
                  Choose
                </option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ZIP code" htmlFor="postalCode" error={error("postalCode")}>
              <Input id="postalCode" autoComplete="postal-code" inputMode="numeric" required maxLength={10} value={details.postalCode} onChange={set("postalCode")} aria-invalid={Boolean(error("postalCode"))} className={inputClass} />
            </Field>
          </div>
          <p className="text-xs text-muted">We ship within the United States only.</p>
        </Section>

        <Section step={3} title="Shipping method">
          {shippingOptions.length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Shipping method</legend>
              {shippingOptions.map((option) => {
                const cents = shippingCentsFor(option, cart.subtotalCents);
                const selected = option.id === methodId;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition has-focus-visible:outline-2 has-focus-visible:outline-accent",
                      selected ? "border-accent bg-accent-soft" : "border-border hover:border-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={selected}
                      onChange={() => {
                        setMethodId(option.id);
                        setQuote(null);
                      }}
                      className="size-4 shrink-0 accent-accent"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{option.name}</span>
                      {option.deliveryText && <span className="text-xs text-muted">{option.deliveryText}</span>}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{cents === 0 ? "Free" : formatCents(cents)}</span>
                  </label>
                );
              })}
              {error("shippingMethodId") && <p className="text-xs text-danger">{error("shippingMethodId")}</p>}
            </fieldset>
          ) : (
            <p className="text-sm text-danger">Shipping isn&apos;t available right now. Please contact us.</p>
          )}
          {cart.bump && <BumpOffer bump={cart.bump} />}
        </Section>

        <Section step={4} title="Payment">
          {!quote ? (
            <>
              <p className="text-sm text-muted">Check your details, then continue to pay securely.</p>
              <button
                type="submit"
                disabled={busy || cartPending || !shippingOptions.length}
                className={cn(buttonClass("primary", "lg"), "w-full")}
              >
                {busy ? "Checking…" : `Continue to payment · ${formatCents(totalCents)}`}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="flex items-baseline justify-between text-lg font-bold">
                <span>Total to pay</span>
                <span className="tabular-nums">{formatCents(quote.totals.totalCents)}</span>
              </p>
              {quote.paymentsConnected ? (
                // The PayPal buttons and card fields go here in the second half of M4
                <p role="status" className="rounded-md bg-surface-muted px-4 py-3 text-sm">
                  Payment options are loading…
                </p>
              ) : (
                <p role="status" className="rounded-md border border-highlight bg-highlight-soft px-4 py-3 text-sm">
                  Online payment is being connected and opens soon. Your details are ready, but no order is placed
                  yet.
                </p>
              )}
              {quote.testOrdersAllowed && (
                <button
                  type="button"
                  onClick={placeTestOrder}
                  disabled={busy}
                  className={cn(buttonClass("secondary", "lg"), "w-full border-dashed")}
                >
                  {busy ? "Placing…" : "Place test order (local development only)"}
                </button>
              )}
            </div>
          )}
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldIcon className="size-4 text-highlight-text" />
            Payments are processed by PayPal. We never see or store your card details.
          </p>
        </Section>

        <TrustBadges badges={trustBadges} className="justify-center" />
      </form>

      <aside className="hidden rounded-lg border border-border bg-surface p-5 shadow-card lg:sticky lg:top-24 lg:block">
        <h2 className="mb-4 font-heading text-lg font-bold">Order summary</h2>
        {summary}
      </aside>
    </div>
  );
}
