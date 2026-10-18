// Order emails as plain HTML strings (table layout, inline styles: what email clients
// support). No React Email: it would add to the Worker bundle for two templates.
// Every value from the order is escaped. Sending (Resend) comes with the PayPal half of M4.

import { formatCents } from "@/lib/money";
import type { OrderWithItems } from "@/lib/orders";
import { customerStatusLabels, formatOrderDate } from "@/lib/orders/labels";
import { formatUsPhone } from "@/lib/validation/checkout";
import { emailTheme as t } from "./theme";

export type RenderedEmail = { subject: string; html: string; text: string };

export type StoreInfo = {
  /** Absolute site URL, e.g. https://supplement-store.abdohafez731.workers.dev */
  siteUrl: string;
  contactEmail: string;
  contactPhone: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const e = escapeHtml;
const money = (cents: number) => (cents === 0 ? "Free" : formatCents(cents));
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function addressLines(order: OrderWithItems) {
  return [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
    `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
  ].filter((line): line is string => Boolean(line));
}

/** Paid lines (and the bump), each followed by its free gifts. */
function itemRows(order: OrderWithItems) {
  const rows: { label: string; amount: string; gift: boolean }[] = [];
  for (const item of order.items.filter((i) => !i.isGift)) {
    rows.push({
      label: `${item.quantity} × ${item.productName}${item.isBump ? " (special offer)" : ""}`,
      amount: formatCents(item.lineTotalCents),
      gift: false,
    });
    for (const gift of order.items.filter((i) => i.isGift && i.parentItemId === item.id)) {
      rows.push({ label: `FREE GIFT: ${gift.quantity} × ${gift.productName}`, amount: "Free", gift: true });
    }
  }
  return rows;
}

function totalsRows(order: OrderWithItems) {
  return [
    { label: "Subtotal", amount: formatCents(order.subtotalCents), strong: false },
    { label: `Shipping (${order.shippingMethodName})`, amount: money(order.shippingCents), strong: false },
    { label: "Total", amount: formatCents(order.totalCents), strong: true },
  ];
}

function layout({ siteUrl, preheader, body, footer }: { siteUrl: string; preheader: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>DRIVEX</title>
</head>
<body style="margin:0;padding:0;background:${t.background};font-family:${t.font};color:${t.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.background};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${t.surface};border:1px solid ${t.border};border-radius:12px;overflow:hidden;">
<tr><td style="background:${t.accent};padding:20px 24px;">
<a href="${e(siteUrl)}"><img src="${e(siteUrl)}/brand/drivex-logo-email.png" width="215" height="36" alt="DRIVEX" style="display:block;border:0;"></a>
</td></tr>
${body}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:16px 24px;font-size:12px;line-height:18px;color:${t.muted};text-align:center;">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(order: OrderWithItems) {
  const items = itemRows(order)
    .map(
      (row) => `<tr>
<td style="padding:8px 0;font-size:14px;line-height:20px;border-bottom:1px solid ${t.border};${row.gift ? `color:${t.highlightText};font-weight:600;` : ""}">${e(row.label)}</td>
<td align="right" style="padding:8px 0;font-size:14px;line-height:20px;border-bottom:1px solid ${t.border};white-space:nowrap;font-weight:600;${row.gift ? `color:${t.highlightText};` : ""}">${e(row.amount)}</td>
</tr>`,
    )
    .join("");
  const totals = totalsRows(order)
    .map(
      (row) => `<tr>
<td style="padding:${row.strong ? "10px" : "4px"} 0 0;font-size:${row.strong ? "16px" : "14px"};${row.strong ? "font-weight:700;" : `color:${t.muted};`}">${e(row.label)}</td>
<td align="right" style="padding:${row.strong ? "10px" : "4px"} 0 0;font-size:${row.strong ? "16px" : "14px"};white-space:nowrap;${row.strong ? "font-weight:700;" : ""}">${e(row.amount)}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}${totals}</table>`;
}

const heading = (text: string) =>
  `<h1 style="margin:0 0 8px;font-family:${t.headingFont};font-size:22px;line-height:28px;color:${t.text};">${e(text)}</h1>`;
const subheading = (text: string) =>
  `<h2 style="margin:24px 0 8px;font-family:${t.headingFont};font-size:16px;line-height:22px;color:${t.text};">${e(text)}</h2>`;
const paragraph = (html: string) => `<p style="margin:0 0 12px;font-size:14px;line-height:22px;">${html}</p>`;
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr><td style="background:${t.accent};border-radius:10px;">
<a href="${e(href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${t.accentForeground};text-decoration:none;">${e(label)}</a>
</td></tr></table>`;

/** Sent to the customer once the order is paid. */
export function customerConfirmationEmail(order: OrderWithItems, store: StoreInfo): RenderedEmail {
  const orderUrl = `${store.siteUrl}/orders/${order.orderNumber}`;
  const contact = [store.contactEmail, store.contactPhone].filter(Boolean).join(" · ");
  const subject = `Your DRIVEX order ${order.orderNumber} is confirmed`;
  const body = `<tr><td style="padding:28px 24px;">
${heading(`Thank you, ${firstName(order.shippingName)}!`)}
${paragraph(`We've received your order <strong>${e(order.orderNumber)}</strong> placed ${e(formatOrderDate(order.paidAt ?? order.createdAt))}. We'll email you again when it ships.`)}
${subheading("Your order")}
${itemsTable(order)}
${subheading("Shipping to")}
${paragraph(addressLines(order).map(e).join("<br>"))}
${button(orderUrl, "View your order")}
${paragraph(`<span style="color:${t.muted};font-size:12px;">To open it, enter this email address and your order number.</span>`)}
</td></tr>`;
  const footer = `${contact ? `Questions? ${e(contact)}<br>` : ""}These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.`;

  const text = [
    `Thank you, ${firstName(order.shippingName)}!`,
    `Your DRIVEX order ${order.orderNumber} is confirmed.`,
    "",
    ...itemRows(order).map((row) => `${row.label}  ${row.amount}`),
    "",
    ...totalsRows(order).map((row) => `${row.label}: ${row.amount}`),
    "",
    "Shipping to:",
    ...addressLines(order),
    "",
    `View your order: ${orderUrl}`,
    contact ? `Questions? ${contact}` : "",
  ].join("\n");

  return { subject, html: layout({ siteUrl: store.siteUrl, preheader: `Order ${order.orderNumber}: ${formatCents(order.totalCents)}`, body, footer }), text };
}

/** Sent to the store's notification email for every paid order. */
export function newOrderAlertEmail(order: OrderWithItems, store: StoreInfo): RenderedEmail {
  const adminUrl = `${store.siteUrl}/admin/orders/${order.id}`;
  const subject = `New order ${order.orderNumber}: ${formatCents(order.totalCents)}`;
  const body = `<tr><td style="padding:28px 24px;">
${heading(`New order ${order.orderNumber}`)}
${paragraph(`${e(formatCents(order.totalCents))} · ${e(customerStatusLabels[order.status])} · ${e(formatOrderDate(order.paidAt ?? order.createdAt))}`)}
${itemsTable(order)}
${subheading("Ship to")}
${paragraph(addressLines(order).map(e).join("<br>"))}
${subheading("Customer")}
${paragraph(`${e(order.email)}<br>${e(formatUsPhone(order.phone))}`)}
${button(adminUrl, "Open in the admin")}
</td></tr>`;
  const text = [
    `New order ${order.orderNumber}: ${formatCents(order.totalCents)}`,
    "",
    ...itemRows(order).map((row) => `${row.label}  ${row.amount}`),
    "",
    ...totalsRows(order).map((row) => `${row.label}: ${row.amount}`),
    "",
    "Ship to:",
    ...addressLines(order),
    "",
    `Customer: ${order.email}, ${formatUsPhone(order.phone)}`,
    `Admin: ${adminUrl}`,
  ].join("\n");
  return { subject, html: layout({ siteUrl: store.siteUrl, preheader: subject, body, footer: "DRIVEX store admin" }), text };
}
