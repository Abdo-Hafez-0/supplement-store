"use client";

import { useRef, useState } from "react";
import { MediaImage } from "./media-image";

type Review = { id: number; fileKey: string; alt: string };

/** Horizontally scrolling review screenshots; tap one to see it full size. */
export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Review | null>(null);

  const scrollBy = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <ul ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {reviews.map((review, index) => (
          <li key={review.id} className="w-[70%] shrink-0 snap-start sm:w-[40%] lg:w-[24%]">
            <button
              type="button"
              className="block aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-surface"
              onClick={() => {
                setOpen(review);
                dialog.current?.showModal();
              }}
              aria-label={`Open review ${index + 1}`}
            >
              <MediaImage
                fileKey={review.fileKey}
                alt={review.alt || `Customer review ${index + 1}`}
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 40vw, 70vw"
                className="object-contain"
              />
            </button>
          </li>
        ))}
      </ul>
      {reviews.length > 2 && (
        <div className="mt-2 hidden justify-end gap-2 sm:flex">
          <button type="button" onClick={() => scrollBy(-1)} className="rounded-full border border-border bg-surface px-3 py-1" aria-label="Previous reviews">
            ←
          </button>
          <button type="button" onClick={() => scrollBy(1)} className="rounded-full border border-border bg-surface px-3 py-1" aria-label="Next reviews">
            →
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[90vh] max-w-[95vw] rounded-lg bg-surface p-0 backdrop:bg-black/70"
      >
        {open && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${open.fileKey}`} alt={open.alt || "Customer review"} className="max-h-[85vh] w-auto" />
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="absolute right-2 top-2 rounded-full bg-surface px-3 py-1 text-sm shadow"
            >
              Close
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
