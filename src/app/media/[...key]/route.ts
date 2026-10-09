import { getMediaBucket } from "@/lib/media";
import { serveMedia } from "@/lib/media/serve";

// On Cloudflare, custom-worker.ts answers /media/* before Next.js runs (so responses
// keep their Content-Length). This route serves the same files under `next dev`.

export async function GET(request: Request, { params }: RouteContext<"/media/[...key]">) {
  return serveMedia(request, getMediaBucket(), (await params).key.join("/"));
}

export async function HEAD(request: Request, { params }: RouteContext<"/media/[...key]">) {
  return serveMedia(request, getMediaBucket(), (await params).key.join("/"));
}
