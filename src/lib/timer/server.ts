import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import type { Settings } from "@/lib/settings/schema";
import { readTimerCookie, signTimerCookie, TIMER_COOKIE, TIMER_COOKIE_MAX_AGE, timerState } from "./index";

/** The visitor's offer timer, from the signed cookie. Read-only: pages can't set cookies. */
export async function getVisitorTimer(timer: Settings["timer"], now = Date.now()) {
  const jar = await cookies();
  const { env } = getCloudflareContext();
  const startedAt = await readTimerCookie(jar.get(TIMER_COOKIE)?.value, env.BETTER_AUTH_SECRET);
  return timerState(startedAt, now, timer);
}

/** Stores a new countdown start (route handlers only). */
export async function writeVisitorTimer(startedAt: number) {
  const jar = await cookies();
  const { env } = getCloudflareContext();
  jar.set(TIMER_COOKIE, await signTimerCookie(startedAt, env.BETTER_AUTH_SECRET), {
    httpOnly: true,
    secure: env.NEXTJS_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: TIMER_COOKIE_MAX_AGE,
  });
}
