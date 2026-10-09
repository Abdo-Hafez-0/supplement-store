"use client";

import { useState } from "react";
import { FileUploadButton } from "@/components/admin/file-upload-button";
import type { FormState } from "@/components/admin/form-state";
import { useFormAction } from "@/components/admin/use-form-action";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { MediaThumb } from "@/components/admin/media-thumb";
import { statusHints, statusLabels } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { productStatuses, type ProductStatus } from "@/lib/db/schema";
import { centsToDollarInput } from "@/lib/money";
import { MAX_PRODUCT_IMAGES } from "@/lib/validation/admin";

export type ProductFormValues = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  regularPriceCents: number | null;
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  images: string[];
};

export const emptyProduct: ProductFormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  regularPriceCents: null,
  stock: 0,
  status: "draft",
  isFeatured: false,
  sortOrder: 0,
  images: [],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ProductForm({
  initial,
  action,
  isNew,
}: {
  initial: ProductFormValues;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  isNew: boolean;
}) {
  const { state, onSubmit, pending } = useFormAction(action);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [status, setStatus] = useState(initial.status);
  const [images, setImages] = useState(initial.images);
  const error = (name: string) => fieldError(state, name);

  function move(index: number, by: number) {
    setImages((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" htmlFor="title" error={error("title")}>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            defaultValue={initial.title}
            aria-invalid={Boolean(error("title"))}
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.currentTarget.value));
            }}
          />
        </Field>
        <Field label="URL slug" htmlFor="slug" error={error("slug")} hint={`/products/${slug || "…"}`}>
          <Input
            id="slug"
            name="slug"
            required
            maxLength={80}
            value={slug}
            aria-invalid={Boolean(error("slug"))}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.currentTarget.value);
            }}
          />
        </Field>
      </div>

      <Field label="Short description" htmlFor="shortDescription" hint="One or two sentences under the title." error={error("shortDescription")}>
        <Textarea id="shortDescription" name="shortDescription" maxLength={300} rows={2} defaultValue={initial.shortDescription} />
      </Field>
      <Field label="Description" htmlFor="description" error={error("description")}>
        <Textarea id="description" name="description" maxLength={10000} rows={6} defaultValue={initial.description} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Regular price ($)"
          htmlFor="regularPrice"
          hint="Shown struck through. Used as the price when there are no tiers."
          error={error("regularPrice")}
        >
          <Input
            id="regularPrice"
            name="regularPrice"
            inputMode="decimal"
            required
            placeholder="49.99"
            defaultValue={initial.regularPriceCents === null ? "" : centsToDollarInput(initial.regularPriceCents)}
            aria-invalid={Boolean(error("regularPrice"))}
          />
        </Field>
        <Field label="Stock (bottles)" htmlFor="stock" error={error("stock")}>
          <Input id="stock" name="stock" inputMode="numeric" required defaultValue={initial.stock} aria-invalid={Boolean(error("stock"))} />
        </Field>
        <Field label="Status" htmlFor="status" hint={statusHints[status]} error={error("status")}>
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value as ProductStatus)}
          >
            {productStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers show first." error={error("sortOrder")}>
          <Input id="sortOrder" name="sortOrder" inputMode="numeric" required defaultValue={initial.sortOrder} />
        </Field>
      </div>

      <Checkbox name="isFeatured" label="Feature on the home page" defaultChecked={initial.isFeatured} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">
          Product images ({images.length}/{MAX_PRODUCT_IMAGES}) — the first one is the main image
        </legend>
        {images.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {images.map((key, index) => (
              <li key={key} className="flex flex-col items-center gap-1">
                <MediaThumb fileKey={key} alt={`Image ${index + 1}`} size="lg" />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move left">
                    ←
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setImages((list) => list.filter((k) => k !== key))}
                    aria-label="Remove image"
                  >
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move right"
                  >
                    →
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <FileUploadButton
          folder="products"
          label="Upload images"
          multiple
          disabled={images.length >= MAX_PRODUCT_IMAGES}
          onUploaded={(key) => setImages((list) => (list.length < MAX_PRODUCT_IMAGES ? [...list, key] : list))}
        />
        {error("images") && <p className="text-xs text-danger">{error("images")}</p>}
        <p className="text-xs text-muted">Image changes are kept when you save the product.</p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>{isNew ? "Create product" : "Save product"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
