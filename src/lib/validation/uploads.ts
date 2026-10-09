import { z } from "zod";
import { MEDIA_KEY, PART_SIZE } from "@/lib/media/rules";
import { mediaFolders } from "./admin";

const MAX_PARTS = 100;

export const startUploadSchema = z.strictObject({
  folder: z.enum(mediaFolders),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4"]),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_PARTS * PART_SIZE),
});

const key = z.string().regex(MEDIA_KEY);
const uploadId = z.string().min(1).max(1024);
const partNumber = z.number().int().min(1).max(MAX_PARTS);

export const uploadPartQuerySchema = z.strictObject({
  key,
  uploadId,
  partNumber: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(partNumber),
});

export const completeUploadSchema = z.strictObject({
  key,
  uploadId,
  parts: z
    .array(z.strictObject({ partNumber, etag: z.string().min(1).max(200) }))
    .min(1)
    .max(MAX_PARTS),
});

export const abortUploadSchema = z.strictObject({ key, uploadId });
