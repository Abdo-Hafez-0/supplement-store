import { getMediaBucket, parseMediaKey } from "@/lib/media";

/**
 * Serves R2 objects at /media/<folder>/<uuid>.<ext>, with Range support (Safari
 * needs it to play video) and conditional requests.
 */
async function serve(request: Request, key: string[], headOnly: boolean) {
  const media = parseMediaKey(key.join("/"));
  if (!media) return new Response("Not found", { status: 404 });

  const range = request.headers.get("range");
  const object = await getMediaBucket().get(key.join("/"), {
    onlyIf: request.headers,
    ...(range ? { range: request.headers } : {}),
  });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", media.type);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-disposition", "inline");

  // A failed precondition (e.g. If-None-Match matched) returns metadata without a body.
  if (!("body" in object)) return new Response(null, { status: 304, headers });

  if (range && object.range) {
    const r = object.range;
    const offset = "suffix" in r ? object.size - r.suffix : (r.offset ?? 0);
    const length = "suffix" in r ? r.suffix : (r.length ?? object.size - offset);
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(headOnly ? null : object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(headOnly ? null : object.body, { status: 200, headers });
}

export async function GET(request: Request, { params }: RouteContext<"/media/[...key]">) {
  return serve(request, (await params).key, false);
}

export async function HEAD(request: Request, { params }: RouteContext<"/media/[...key]">) {
  return serve(request, (await params).key, true);
}
