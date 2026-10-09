import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Same parameters and "salt:key" hex format as Better Auth's default hasher,
// but always on the native node:crypto scrypt. The pure-JS fallback is too
// slow for the Workers CPU budget.
const N = 16384;
const r = 16;
const p = 1;
const dkLen = 64;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      dkLen,
      { N, r, p, maxmem: 128 * N * r * 2 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = await deriveKey(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
