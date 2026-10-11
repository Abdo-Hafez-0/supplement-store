// Per-visitor countdown. The start time lives in a signed cookie; the server works
// out the phase, so a visitor can't extend the offer by editing the cookie.
// M2 shows it on the product page; M3 uses the same phase to price the cart.

import type { Settings } from "@/lib/settings/schema";

export const TIMER_COOKIE = "offer_timer";
export const TIMER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type TimerState =
  | { phase: "off" }
  /** Bundle prices apply until `endsAt` */
  | { phase: "running"; startedAt: number; endsAt: number }
  /** Offer ended: regular prices until `regularUntil`, then a new countdown starts */
  | { phase: "expired"; startedAt: number; endsAt: number; regularUntil: number };

/**
 * The visitor's timer phase at `now`. `startedAt` is null for a first visit.
 * `restart` is true when a new countdown has to be stored in the cookie.
 */
export function timerState(
  startedAt: number | null,
  now: number,
  timer: Settings["timer"],
): { state: TimerState; restart: boolean } {
  if (!timer.enabled) return { state: { phase: "off" }, restart: false };
  const duration = timer.durationMinutes * 60_000;
  const fresh = () => ({ state: { phase: "running", startedAt: now, endsAt: now + duration } as const, restart: true });

  // No cookie, or a start time in the future (clock games): start over
  if (startedAt === null || startedAt > now) return fresh();

  const endsAt = startedAt + duration;
  if (now < endsAt) return { state: { phase: "running", startedAt, endsAt }, restart: false };

  if (timer.expiryBehavior === "restart_immediately") return fresh();

  const regularUntil = endsAt + timer.regularPriceHours * 3_600_000;
  if (now < regularUntil) return { state: { phase: "expired", startedAt, endsAt, regularUntil }, restart: false };
  return fresh();
}

/** Bundle (tier) prices apply unless the visitor's offer has expired. */
export function offerActive(state: TimerState) {
  return state.phase !== "expired";
}

// --- Signed cookie value: "<startedAtMs>.<hmac>" -----------------------------

const encoder = new TextEncoder();

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`offer-timer:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return btoa(String.fromCharCode(...signature)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function signTimerCookie(startedAt: number, secret: string) {
  return `${startedAt}.${await hmac(secret, String(startedAt))}`;
}

/** The start time from a cookie value, or null when missing, malformed or forged. */
export async function readTimerCookie(value: string | undefined, secret: string): Promise<number | null> {
  if (!value) return null;
  const match = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return null;
  const expected = await hmac(secret, match[1]);
  // Equal-length strings; compare without early exit
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ match[2].charCodeAt(i);
  return diff === 0 ? Number(match[1]) : null;
}
