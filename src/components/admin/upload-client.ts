import type { MediaFolder } from "@/lib/validation/admin";

type StartResponse = { key: string; uploadId: string; partSize: number; partCount: number };

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Upload failed (${response.status})`);
  return body;
}

const json = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});

/**
 * Uploads a file to R2 in chunks through the admin upload routes.
 * Returns the new object key. `onProgress` receives 0..1.
 */
export async function uploadFile(
  file: File,
  folder: MediaFolder,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const start = await call<StartResponse>(
    "/api/admin/uploads",
    json({ folder, contentType: file.type, size: file.size }),
  );
  const { key, uploadId, partSize, partCount } = start;
  try {
    const parts: { partNumber: number; etag: string }[] = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const chunk = file.slice((partNumber - 1) * partSize, partNumber * partSize);
      const query = new URLSearchParams({ key, uploadId, partNumber: String(partNumber) });
      parts.push(
        await call<{ partNumber: number; etag: string }>(`/api/admin/uploads/part?${query}`, {
          method: "PUT",
          body: chunk,
        }),
      );
      onProgress?.(partNumber / partCount);
    }
    await call("/api/admin/uploads/complete", json({ key, uploadId, parts }));
    return key;
  } catch (error) {
    await fetch("/api/admin/uploads/abort", json({ key, uploadId })).catch(() => undefined);
    throw error;
  }
}
