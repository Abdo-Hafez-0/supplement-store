import { adminApiGuard } from "@/lib/auth";
import { folderRules, getMediaBucket, PART_SIZE, parseMediaKey, sniffMediaType } from "@/lib/media";
import { uploadPartQuerySchema } from "@/lib/validation/uploads";

/** Uploads one chunk. The first chunk must really be the file type the key claims. */
export async function PUT(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const parsed = uploadPartQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "Invalid part request" }, { status: 400 });
  const { key, uploadId, partNumber } = parsed.data;
  const media = parseMediaKey(key);
  if (!media) return Response.json({ error: "Invalid key" }, { status: 400 });

  if ((partNumber - 1) * PART_SIZE >= folderRules[media.folder].maxBytes) {
    return Response.json({ error: "File is too large" }, { status: 413 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PART_SIZE) return Response.json({ error: "Chunk is too large" }, { status: 413 });
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > PART_SIZE) {
    return Response.json({ error: "Invalid chunk size" }, { status: 413 });
  }
  if (partNumber === 1 && sniffMediaType(body) !== media.type) {
    return Response.json({ error: "The file content does not match its type" }, { status: 415 });
  }

  const part = await getMediaBucket().resumeMultipartUpload(key, uploadId).uploadPart(partNumber, body);
  return Response.json({ partNumber: part.partNumber, etag: part.etag });
}
