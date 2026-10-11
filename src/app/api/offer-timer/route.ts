import { getRequestSettings } from "@/lib/settings";
import { getVisitorTimer, writeVisitorTimer } from "@/lib/timer/server";

/**
 * The visitor's countdown. Starts (or restarts) it in a signed cookie when needed,
 * so every visitor gets their own timer and can't extend it from the browser.
 * POST because it may set a cookie; it takes no input.
 */
export async function POST() {
  const { timer } = await getRequestSettings();
  const now = Date.now();
  const { state, restart } = await getVisitorTimer(timer, now);
  if (restart && state.phase === "running") await writeVisitorTimer(state.startedAt);
  return Response.json({ ...state, now }, { headers: { "cache-control": "no-store" } });
}
