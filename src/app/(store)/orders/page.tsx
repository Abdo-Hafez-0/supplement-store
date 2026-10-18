import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/store/order-lookup-form";

export const metadata: Metadata = { title: "Find your order" };

export default function OrderLookupPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-5 px-gutter py-10">
      <div className="flex flex-col gap-2">
        <span aria-hidden className="h-1 w-12 rounded-full bg-highlight" />
        <h1 className="font-heading text-3xl font-bold">Find your order</h1>
        <p className="text-muted">Enter the email you used at checkout and your order number to see its status.</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <OrderLookupForm />
      </div>
    </section>
  );
}
