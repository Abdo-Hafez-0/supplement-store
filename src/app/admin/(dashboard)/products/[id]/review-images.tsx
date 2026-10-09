"use client";

import { useState, useTransition } from "react";
import { FileUploadButton } from "@/components/admin/file-upload-button";
import { idle, type FormState } from "@/components/admin/form-state";
import { FormMessage } from "@/components/admin/form-status";
import { MediaThumb } from "@/components/admin/media-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { MAX_REVIEW_IMAGES } from "@/lib/validation/admin";

type ReviewImage = { id: number; fileKey: string; alt: string };

export function ReviewImages({
  images,
  addAction,
  updateAltAction,
  reorderAction,
  deleteAction,
}: {
  images: ReviewImage[];
  addAction: (input: { fileKey: string; alt: string }) => Promise<FormState>;
  updateAltAction: (id: number, alt: string) => Promise<FormState>;
  reorderAction: (orderedIds: number[]) => Promise<FormState>;
  deleteAction: (id: number) => Promise<FormState>;
}) {
  const [state, setState] = useState<FormState>(idle);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<FormState>) => startTransition(async () => setState(await work()));

  function move(index: number, by: number) {
    const ids = images.map((image) => image.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + by, 0, id);
    run(() => reorderAction(ids));
  }

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <p className="text-sm text-muted">No review images yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="flex gap-3 rounded-lg border border-border p-3">
              <MediaThumb fileKey={image.fileKey} alt={image.alt} size="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input
                  aria-label={`Description for review image ${index + 1}`}
                  placeholder="Short description (for screen readers)"
                  defaultValue={image.alt}
                  maxLength={200}
                  onBlur={(event) => {
                    const alt = event.currentTarget.value;
                    if (alt !== image.alt) run(() => updateAltAction(image.id, alt));
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" disabled={pending || index === 0} onClick={() => move(index, -1)} aria-label="Move earlier">
                    ←
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move later"
                  >
                    →
                  </Button>
                  <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => deleteAction(image.id))}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-start gap-4">
        <FileUploadButton
          folder="reviews"
          label={`Upload review images (${images.length}/${MAX_REVIEW_IMAGES})`}
          multiple
          disabled={pending || images.length >= MAX_REVIEW_IMAGES}
          onUploaded={async (fileKey) => setState(await addAction({ fileKey, alt: "" }))}
        />
        <FormMessage state={state} />
      </div>
    </div>
  );
}
