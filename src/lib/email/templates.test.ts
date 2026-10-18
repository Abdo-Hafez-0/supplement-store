import { describe, expect, it } from "vitest";
import type { OrderWithItems } from "@/lib/orders";
import { customerConfirmationEmail, escapeHtml, newOrderAlertEmail } from "./templates";

const at = new Date("2026-10-18T18:30:00Z");
const base = { createdAt: at, updatedAt: at, orderId: 1, productId: 1, parentItemId: null, isGift: false, isBump: false };

const order: OrderWithItems = {
  id: 7,
  orderNumber: "DX-7K3M9QX2",
  paypalOrderId: "PAYPAL-1",
  paypalCaptureId: "CAPTURE-1",
  status: "paid",
  email: "jane@example.com",
  phone: "2125550100",
  shippingName: "Jane <script>alert(1)</script> Doe",
  shippingLine1: "1 Main St",
  shippingLine2: null,
  shippingCity: "Springfield",
  shippingState: "IL",
  shippingPostalCode: "62701",
  shippingCountry: "US",
  shippingMethodId: 1,
  shippingMethodName: "Standard",
  currency: "USD",
  subtotalCents: 9996,
  shippingCents: 0,
  discountCents: 0,
  taxCents: 0,
  totalCents: 9996,
  cartId: null,
  paidAt: at,
  trackingNumber: null,
  shippedAt: null,
  refundedAt: null,
  createdAt: at,
  updatedAt: at,
  items: [
    { ...base, id: 1, productName: "Multivitamin", unitPriceCents: 3166, quantity: 3, lineTotalCents: 9497 },
    { ...base, id: 2, productId: 11, productName: "Organizer", unitPriceCents: 499, quantity: 1, lineTotalCents: 499, isBump: true },
    { ...base, id: 3, productId: 10, productName: "Shaker", unitPriceCents: 0, quantity: 2, lineTotalCents: 0, isGift: true, parentItemId: 1 },
  ],
};
const store = { siteUrl: "https://shop.test", contactEmail: "help@shop.test", contactPhone: "" };

describe("order emails", () => {
  it("confirms the order to the customer with items, gifts, totals and a link", () => {
    const email = customerConfirmationEmail(order, store);
    expect(email.subject).toBe("Your DRIVEX order DX-7K3M9QX2 is confirmed");
    expect(email.html).toContain("3 × Multivitamin");
    expect(email.html).toContain("FREE GIFT: 2 × Shaker");
    expect(email.html).toContain("1 × Organizer (special offer)");
    expect(email.html).toContain("$99.96");
    expect(email.html).toContain("https://shop.test/orders/DX-7K3M9QX2");
    expect(email.text).toContain("Total: $99.96");
    expect(email.text).toContain("Shipping (Standard): Free");
  });

  it("escapes customer-entered text", () => {
    const email = customerConfirmationEmail(order, store);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });

  it("alerts the store with the customer and an admin link", () => {
    const email = newOrderAlertEmail(order, store);
    expect(email.subject).toBe("New order DX-7K3M9QX2: $99.96");
    expect(email.html).toContain("jane@example.com");
    expect(email.html).toContain("(212) 555-0100");
    expect(email.html).toContain("https://shop.test/admin/orders/7");
  });
});
