import type { MediaFolder } from "@/lib/validation/admin";

// Pure upload rules shared by the browser uploader and the upload routes.

export const MiB = 1024 * 1024;

/** R2 multipart parts must be at least 5 MiB (except the last) and equal-sized. */
export const PART_SIZE = 10 * MiB;

export type MediaType = "image/jpeg" | "image/png" | "image/webp" | "video/mp4";

export const extensionFor: Record<MediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

const typeForExtension = Object.fromEntries(
  Object.entries(extensionFor).map(([type, ext]) => [ext, type]),
) as Record<string, MediaType>;

const images: MediaType[] = ["image/jpeg", "image/png", "image/webp"];

export const folderRules: Record<MediaFolder, { types: MediaType[]; maxBytes: number; label: string }> = {
  products: { types: images, maxBytes: 5 * MiB, label: "JPEG, PNG or WebP, up to 5 MB" },
  reviews: { types: images, maxBytes: 5 * MiB, label: "JPEG, PNG or WebP, up to 5 MB" },
  video: { types: ["video/mp4"], maxBytes: 200 * MiB, label: "MP4, up to 200 MB" },
};

/** products/<uuid>.webp etc. Only keys of this shape are ever read or written. */
export const MEDIA_KEY = /^(products|reviews|video)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp|mp4)$/;

export function parseMediaKey(key: string): { folder: MediaFolder; type: MediaType } | null {
  const match = MEDIA_KEY.exec(key);
  if (!match) return null;
  const folder = match[1] as MediaFolder;
  const type = typeForExtension[match[3]];
  if (!type || !folderRules[folder].types.includes(type)) return null;
  return { folder, type };
}

export function partCount(size: number) {
  return Math.max(1, Math.ceil(size / PART_SIZE));
}

/** Detects the real file type from its first bytes, so a renamed file can't pass as an image. */
export function sniffMediaType(bytes: Uint8Array): MediaType | null {
  const at = (offset: number, ...values: number[]) => values.every((v, i) => bytes[offset + i] === v);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return "video/mp4"; // "ftyp" box
  return null;
}
