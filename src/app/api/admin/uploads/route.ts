import { adminApiGuard } from "@/lib/auth";
import { extensionFor, folderRules, getMediaBucket, PART_SIZE, partCount } from "@/lib/media";
import { startUploadSchema } from "@/lib/validation/uploads";

/**
 * Starts a multipart upload to R2. The browser then sends the file in PART_SIZE
 * chunks to /part and finishes with /complete, so no request carries a large body.
 */
export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = startUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid upload request" }, { status: 400 });

  const { folder, contentType, size } = parsed.data;
  const rules = folderRules[folder];
  if (!rules.types.includes(contentType)) {
    return Response.json({ error: `Wrong file type. Allowed: ${rules.label}` }, { status: 400 });
  }
  if (size > rules.maxBytes) {
    return Response.json({ error: `File is too large. Allowed: ${rules.label}` }, { status: 400 });
  }

  const key = `${folder}/${crypto.randomUUID()}.${extensionFor[contentType]}`;
  const upload = await getMediaBucket().createMultipartUpload(key, {
    httpMetadata: {
      contentType,
      // Keys are never reused, so the content behind a URL never changes.
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return Response.json({
    key,
    uploadId: upload.uploadId,
    partSize: PART_SIZE,
    partCount: partCount(size),
  });
}
