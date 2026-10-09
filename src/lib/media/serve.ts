import { parseMediaKey } from "./rules";

/**
 * Serves an R2 object for /media/<key>, with Range support (Safari needs it to play
 * video), conditional requests and immutable caching. Framework-free so the custom
 * Worker entry can answer media requests before Next.js runs.
 */
export async function serveMedia(request: Request, bucket: R2Bucket, key: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const media = parseMediaKey(key);
  if (!media) return new Response("Not found", { status: 404 });

  const range = request.headers.get("range");
  const object = await bucket.get(key, {
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
  const body = request.method === "HEAD" ? null : object.body;

  if (range && object.range) {
    // workerd may include unset fields (e.g. suffix: undefined), so check values, not keys.
    const r = object.range as { offset?: number; length?: number; suffix?: number };
    const suffix = typeof r.suffix === "number" ? Math.min(r.suffix, object.size) : null;
    const offset = suffix !== null ? object.size - suffix : (r.offset ?? 0);
    const length = suffix !== null ? suffix : (r.length ?? object.size - offset);
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(body, { status: 200, headers });
}
