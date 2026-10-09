import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export * from "./rules";

export function getMediaBucket(): R2Bucket {
  return getCloudflareContext().env.MEDIA;
}

/** Public URL path for an R2 key (served by src/app/media/[...key]/route.ts). */
export function mediaUrl(key: string) {
  return `/media/${key}`;
}

/** Best-effort removal of files no longer referenced. Never fails the caller. */
export async function deleteMedia(keys: (string | null | undefined)[]) {
  const list = keys.filter((key): key is string => Boolean(key));
  if (!list.length) return;
  try {
    await getMediaBucket().delete(list);
  } catch (error) {
    console.error("Failed to delete media", list, error);
  }
}
