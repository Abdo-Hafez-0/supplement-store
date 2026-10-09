"use client";

import { useId, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { folderRules } from "@/lib/media/rules";
import type { MediaFolder } from "@/lib/validation/admin";
import { uploadFile } from "./upload-client";

/** Picks files, uploads each to R2 and reports the new keys. */
export function FileUploadButton({
  folder,
  label,
  multiple = false,
  disabled = false,
  onUploaded,
}: {
  folder: MediaFolder;
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  onUploaded: (key: string, file: File) => void | Promise<void>;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rules = folderRules[folder];

  async function onChange(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files];
    try {
      for (const [index, file] of list.entries()) {
        if (!rules.types.includes(file.type as (typeof rules.types)[number]) || file.size > rules.maxBytes) {
          throw new Error(`${file.name}: allowed files are ${rules.label}.`);
        }
        const prefix = list.length > 1 ? `${index + 1}/${list.length} ` : "";
        setProgress(`${prefix}Uploading…`);
        const key = await uploadFile(file, folder, (fraction) =>
          setProgress(`${prefix}Uploading ${Math.round(fraction * 100)}%`),
        );
        await onUploaded(key, file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className={buttonClass("secondary", "sm") + (disabled || progress ? " pointer-events-none opacity-60" : " cursor-pointer")}
      >
        {progress ?? label}
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        className="sr-only"
        accept={rules.types.join(",")}
        multiple={multiple}
        disabled={disabled || progress !== null}
        onChange={(event) => onChange(event.currentTarget.files)}
      />
      <p className="text-xs text-muted">{rules.label}</p>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
