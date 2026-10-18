// HMAC-SHA256 signatures for signed cookies (Web Crypto, works on Workers).
// `purpose` separates keys per use, so a value signed for one cookie can't be
// replayed as another.

const encoder = new TextEncoder();

/** base64url HMAC of `message` (43 characters). */
export async function hmacSign(purpose: string, secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${purpose}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return btoa(String.fromCharCode(...signature)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Constant-time comparison for equal-length strings. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
