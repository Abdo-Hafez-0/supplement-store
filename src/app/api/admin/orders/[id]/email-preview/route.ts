import { getCloudflareContext } from "@opennextjs/cloudflare";
import { adminApiGuard } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { customerConfirmationEmail, newOrderAlertEmail } from "@/lib/email/templates";
import { getOrderById } from "@/lib/orders";
import { getRequestSettings } from "@/lib/settings";

/** Admin only: shows an order's confirmation email (or ?type=alert, the new-order alert) as it will be sent. */
export async function GET(request: Request, { params }: RouteContext<"/api/admin/orders/[id]/email-preview">) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) return new Response("Not found", { status: 404 });
  const order = await getOrderById(getDb(), Number(id));
  if (!order) return new Response("Not found", { status: 404 });

  const { home } = await getRequestSettings();
  const store = {
    siteUrl: new URL(getCloudflareContext().env.BETTER_AUTH_URL ?? request.url).origin,
    contactEmail: home.contactEmail,
    contactPhone: home.contactPhone,
  };
  const type = new URL(request.url).searchParams.get("type");
  const email = type === "alert" ? newOrderAlertEmail(order, store) : customerConfirmationEmail(order, store);
  return new Response(email.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // The preview only needs its own inline styles and the logo image
      "content-security-policy": "default-src 'none'; img-src 'self' https:; style-src 'unsafe-inline'",
    },
  });
}
