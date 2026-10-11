import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/schema";
import { offerActive, readTimerCookie, signTimerCookie, timerState } from "@/lib/timer";

const MIN = 60_000;
const HOUR = 60 * MIN;
const t0 = Date.UTC(2026, 9, 11, 12, 0, 0);
const timer = { ...defaultSettings.timer, enabled: true, durationMinutes: 15, regularPriceHours: 24 };

describe("timerState", () => {
  it("is off when disabled", () => {
    expect(timerState(t0, t0, { ...timer, enabled: false })).toEqual({ state: { phase: "off" }, restart: false });
  });

  it("starts a countdown on the first visit", () => {
    expect(timerState(null, t0, timer)).toEqual({
      state: { phase: "running", startedAt: t0, endsAt: t0 + 15 * MIN },
      restart: true,
    });
  });

  it("keeps running from the stored start", () => {
    const { state, restart } = timerState(t0, t0 + 10 * MIN, timer);
    expect(state).toEqual({ phase: "running", startedAt: t0, endsAt: t0 + 15 * MIN });
    expect(restart).toBe(false);
    expect(offerActive(state)).toBe(true);
  });

  it("expires at zero and keeps regular prices for the configured hours", () => {
    const { state, restart } = timerState(t0, t0 + 15 * MIN, timer);
    expect(state).toEqual({ phase: "expired", startedAt: t0, endsAt: t0 + 15 * MIN, regularUntil: t0 + 15 * MIN + 24 * HOUR });
    expect(restart).toBe(false);
    expect(offerActive(state)).toBe(false);
  });

  it("restarts after the regular-price period", () => {
    const now = t0 + 15 * MIN + 24 * HOUR;
    expect(timerState(t0, now, timer)).toEqual({
      state: { phase: "running", startedAt: now, endsAt: now + 15 * MIN },
      restart: true,
    });
  });

  it("restarts right away when set to restart_immediately", () => {
    const now = t0 + 16 * MIN;
    const { state, restart } = timerState(t0, now, { ...timer, expiryBehavior: "restart_immediately" });
    expect(state.phase).toBe("running");
    expect(restart).toBe(true);
  });

  it("starts over when the stored start is in the future", () => {
    expect(timerState(t0 + HOUR, t0, timer).restart).toBe(true);
  });
});

describe("timer cookie", () => {
  const secret = "test-secret-with-enough-entropy-0123456789";

  it("round-trips a signed start time", async () => {
    const value = await signTimerCookie(t0, secret);
    expect(await readTimerCookie(value, secret)).toBe(t0);
  });

  it("rejects an edited start time", async () => {
    const value = await signTimerCookie(t0, secret);
    const forged = value.replace(String(t0), String(t0 + HOUR));
    expect(await readTimerCookie(forged, secret)).toBeNull();
  });

  it("rejects a different secret and malformed values", async () => {
    const value = await signTimerCookie(t0, secret);
    expect(await readTimerCookie(value, "another-secret")).toBeNull();
    expect(await readTimerCookie("garbage", secret)).toBeNull();
    expect(await readTimerCookie(undefined, secret)).toBeNull();
  });
});
