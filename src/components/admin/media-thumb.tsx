import { cn } from "@/components/ui/cn";

const sizes = { sm: "size-10", md: "size-24", lg: "size-32" } as const;

/**
 * Admin thumbnail for an R2 key. Plain <img>: the admin shows the original
 * upload; the storefront uses next/image for resized versions.
 */
export function MediaThumb({
  fileKey,
  alt,
  size = "md",
  className,
}: {
  fileKey: string | null | undefined;
  alt: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!fileKey) {
    return <div className={cn(sizes[size], "shrink-0 rounded-md border border-dashed border-border bg-surface-muted", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/media/${fileKey}`}
      alt={alt}
      loading="lazy"
      className={cn(sizes[size], "shrink-0 rounded-md border border-border object-cover", className)}
    />
  );
}
