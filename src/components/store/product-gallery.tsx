"use client";

import { useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { ImagePlaceholder, MediaImage } from "./media-image";

/** Swipeable on phones (scroll snap), with thumbnails to jump between images. */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg border border-border">
        <ImagePlaceholder />
      </div>
    );
  }

  function goTo(index: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={track}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface [scrollbar-width:none]"
        onScroll={(event) => {
          const el = event.currentTarget;
          setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        aria-label={`${title} images`}
        role="region"
        tabIndex={0}
      >
        {images.map((key, index) => (
          <div key={key} className="h-full w-full shrink-0 snap-center">
            <MediaImage
              fileKey={key}
              alt={index === 0 ? title : `${title}, image ${index + 1}`}
              sizes="(min-width: 768px) 50vw, 100vw"
              priority={index === 0}
              className="object-contain"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((key, index) => (
            <button
              key={key}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border-2 bg-surface",
                index === active ? "border-accent" : "border-transparent",
              )}
            >
              <MediaImage fileKey={key} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
