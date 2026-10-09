import { adminApiGuard } from "@/lib/auth";
import { getMediaBucket } from "@/lib/media";
import { abortUploadSchema } from "@/lib/validation/uploads";

export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = abortUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  await getMediaBucket().resumeMultipartUpload(parsed.data.key, parsed.data.uploadId).abort();
  return new Response(null, { status: 204 });
}
