import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/db/schema";
import { adminStatusLabels } from "@/lib/orders/labels";

const tones: Record<OrderStatus, BadgeTone> = {
  pending: "outline",
  paid: "highlight",
  shipped: "success",
  refunded: "neutral",
  cancelled: "outline",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={tones[status]}>{adminStatusLabels[status]}</Badge>;
}
