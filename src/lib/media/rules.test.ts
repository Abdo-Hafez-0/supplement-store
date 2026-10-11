import { describe, expect, it } from "vitest";
import { MiB, PART_SIZE, parseMediaKey, partCount, sniffMediaType, thumbKeyFor } from "@/lib/media/rules";

const uuid = "0b0a6c1e-0d6e-4c1f-9d0e-2a2f5e7c9b11";

describe("parseMediaKey", () => {
  it("accepts keys the upload route creates", () => {
    expect(parseMediaKey(`products/${uuid}.webp`)).toEqual({ folder: "products", type: "image/webp", isThumb: false });
    expect(parseMediaKey(`video/${uuid}.mp4`)).toEqual({ folder: "video", type: "video/mp4", isThumb: false });
  });

  it.each([
    `products/${uuid}.mp4`, // video in an image folder
    `video/${uuid}.png`,
    `other/${uuid}.png`,
    `products/../${uuid}.png`,
    `products/${uuid}.png?x=1`,
    "products/abc.png",
  ])("rejects %s", (key) => {
    expect(parseMediaKey(key)).toBeNull();
  });
});

describe("sniffMediaType", () => {
  it("detects real file signatures", () => {
    expect(sniffMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMediaType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffMediaType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffMediaType(new TextEncoder().encode("\0\0\0\x20ftypisom"))).toBe("video/mp4");
  });

  it("rejects HTML and other content", () => {
    expect(sniffMediaType(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(sniffMediaType(new Uint8Array())).toBeNull();
  });
});

describe("partCount", () => {
  it("splits files into fixed-size parts", () => {
    expect(partCount(1)).toBe(1);
    expect(partCount(PART_SIZE)).toBe(1);
    expect(partCount(PART_SIZE + 1)).toBe(2);
    expect(partCount(200 * MiB)).toBe(20);
  });
});

describe("thumbnails", () => {
  it("accepts thumbnail keys for images only", () => {
    expect(parseMediaKey(`products/${uuid}-thumb.webp`)).toEqual({ folder: "products", type: "image/webp", isThumb: true });
    expect(parseMediaKey(`video/${uuid}-thumb.mp4`)).toBeNull();
  });

  it("derives the thumbnail key in the same format", () => {
    expect(thumbKeyFor(`products/${uuid}.jpg`)).toBe(`products/${uuid}-thumb.jpg`);
    expect(thumbKeyFor(`reviews/${uuid}.png`)).toBe(`reviews/${uuid}-thumb.png`);
    expect(thumbKeyFor(`video/${uuid}.mp4`)).toBeNull();
    expect(thumbKeyFor(`products/${uuid}-thumb.jpg`)).toBeNull();
  });
});
