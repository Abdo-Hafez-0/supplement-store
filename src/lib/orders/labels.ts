import type { OrderStatus } from "@/lib/db/schema";

/** What the customer sees on their order page and in emails. */
export const customerStatusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Confirmed, preparing to ship",
  shipped: "Shipped",
  refunded: "Refunded",
  cancelled: "Payment not completed",
};

/** What the admin sees in the order list and detail. */
export const adminStatusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid (to ship)",
  shipped: "Shipped",
  refunded: "Refunded",
  cancelled: "Payment failed",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

/** e.g. "Oct 18, 2026, 2:30 PM ET" (the store's time zone) */
export function formatOrderDate(date: Date) {
  return `${dateFormat.format(date)} ET`;
}
