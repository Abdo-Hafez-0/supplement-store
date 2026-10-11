import { FULL_IMAGE_PX, THUMB_IMAGE_PX, type MediaType } from "@/lib/media/rules";

// Resizes images in the admin's browser before upload, so shoppers download small
// files and the Worker never has to transform images (free-plan friendly). Re-encoding
// also drops EXIF data such as phone GPS location.

type Encoded = { blob: Blob; type: MediaType };

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(bitmap: ImageBitmap, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot resize images.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = context.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

/**
 * Picks one output format for both sizes: WebP where the browser can encode it
 * (Chrome, Edge, Firefox). Safari can't, so it gets JPEG for photos and PNG only
 * when the image has transparency.
 */
async function encode(canvas: HTMLCanvasElement, preferred: MediaType | null, transparent: () => boolean): Promise<Encoded> {
  if (preferred === null || preferred === "image/webp") {
    const webp = await toBlob(canvas, "image/webp", 0.82);
    // Unsupported types silently come back as PNG
    if (webp?.type === "image/webp") return { blob: webp, type: "image/webp" };
  }
  const type: MediaType =
    preferred === "image/png" || preferred === "image/jpeg" ? preferred : transparent() ? "image/png" : "image/jpeg";
  const blob = await toBlob(canvas, type, type === "image/jpeg" ? 0.85 : undefined);
  if (!blob || blob.type !== type) throw new Error("This browser cannot encode the image.");
  return { blob, type };
}

const extension: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** The full image (longest side up to 1600 px) and its thumbnail (up to 480 px), same format. */
export async function prepareImage(file: File): Promise<{ full: File; thumb: File }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name}: this image could not be read.`);
  }
  try {
    const full = draw(bitmap, FULL_IMAGE_PX);
    const fullEncoded = await encode(full.canvas, null, () =>
      hasTransparency(full.context, full.canvas.width, full.canvas.height),
    );
    const thumb = draw(bitmap, THUMB_IMAGE_PX);
    const thumbEncoded = await encode(thumb.canvas, fullEncoded.type, () => false);

    const base = file.name.replace(/\.[^.]+$/, "");
    const ext = extension[fullEncoded.type];
    return {
      full: new File([fullEncoded.blob], `${base}.${ext}`, { type: fullEncoded.type }),
      thumb: new File([thumbEncoded.blob], `${base}-thumb.${ext}`, { type: thumbEncoded.type }),
    };
  } finally {
    bitmap.close();
  }
}
