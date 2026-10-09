import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { shippingMethods } from "@/lib/db/schema";
import { deleteShippingMethod, saveShippingMethod } from "./actions";
import { ShippingMethodForm } from "./shipping-method-form";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingPage() {
  await requireAdmin();
  const methods = await getDb()
    .select()
    .from(shippingMethods)
    .orderBy(asc(shippingMethods.sortOrder), asc(shippingMethods.id));

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Shipping</h1>
        <p className="mt-1 text-sm text-muted">
          Customers choose from the active methods at checkout. The free-shipping callout text is in Settings.
        </p>
      </div>

      {methods.map((method) => (
        <Card key={method.id} title={method.name}>
          <ShippingMethodForm
            method={method}
            saveAction={saveShippingMethod.bind(null, method.id)}
            deleteAction={deleteShippingMethod.bind(null, method.id)}
          />
        </Card>
      ))}

      <Card title="Add a shipping method">
        <ShippingMethodForm method={null} saveAction={saveShippingMethod.bind(null, null)} />
      </Card>
    </>
  );
}
