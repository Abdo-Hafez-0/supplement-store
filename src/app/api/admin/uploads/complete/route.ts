import { adminApiGuard } from "@/lib/auth";
import { folderRules, getMediaBucket, parseMediaKey } from "@/lib/media";
import { completeUploadSchema } from "@/lib/validation/uploads";

export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = completeUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { key, uploadId, parts } = parsed.data;
  const media = parseMediaKey(key);
  if (!media) return Response.json({ error: "Invalid key" }, { status: 400 });

  const bucket = getMediaBucket();
  const object = await bucket.resumeMultipartUpload(key, uploadId).complete(parts);
  if (object.size > folderRules[media.folder].maxBytes) {
    await bucket.delete(key);
    return Response.json({ error: "File is too large" }, { status: 413 });
  }
  return Response.json({ key, size: object.size });
}
