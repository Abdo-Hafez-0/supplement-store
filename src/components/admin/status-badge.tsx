import type { ProductStatus } from "@/lib/db/schema";
import { cn } from "@/components/ui/cn";

export const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  unlisted: "Unlisted",
  draft: "Draft",
};

export const statusHints: Record<ProductStatus, string> = {
  active: "Shown in the store and can be bought.",
  unlisted: "Can be bought by link and used as a gift or bump, but not shown in the listing.",
  draft: "Hidden and cannot be bought.",
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active" && "bg-success text-white",
        status === "unlisted" && "bg-surface-muted text-text",
        status === "draft" && "border border-border text-muted",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
