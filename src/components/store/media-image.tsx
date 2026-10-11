import { cn } from "@/components/ui/cn";
import { FULL_IMAGE_PX, THUMB_IMAGE_PX, thumbKeyFor } from "@/lib/media/rules";

/**
 * Product and review images. The admin uploader stores a full size (1600 px) and a
 * thumbnail (480 px); the browser picks one via srcset, so phones on a grid only
 * download thumbnails. Served straight from R2 by the Worker, no image service.
 */
export function MediaImage({
  fileKey,
  alt,
  sizes,
  className,
  priority = false,
}: {
  fileKey: string;
  alt: string;
  /** e.g. "(min-width: 768px) 50vw, 100vw" */
  sizes: string;
  className?: string;
  /** Above-the-fold images load eagerly with high priority */
  priority?: boolean;
}) {
  const thumb = thumbKeyFor(fileKey);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/media/${fileKey}`}
      srcSet={thumb ? `/media/${thumb} ${THUMB_IMAGE_PX}w, /media/${fileKey} ${FULL_IMAGE_PX}w` : undefined}
      sizes={thumb ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function ImagePlaceholder({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-full w-full bg-surface-muted", className)} />;
}
