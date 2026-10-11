"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TimerState } from "@/lib/timer";

type Remote = TimerState & { now: number };

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Countdown for the visitor's bundle offer. The server owns the timer (signed
 * cookie); this only displays it. When it reaches zero the page refreshes so the
 * tier cards switch to regular prices.
 */
export function OfferTimer({ initial }: { initial: TimerState }) {
  const router = useRouter();
  const [state, setState] = useState<TimerState>(initial);
  const [now, setNow] = useState<number | null>(null);
  const skew = useRef(0); // server time - browser time

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offer-timer", { method: "POST" })
      .then((response) => (response.ok ? (response.json() as Promise<Remote>) : null))
      .then((remote) => {
        if (!remote || cancelled) return;
        skew.current = remote.now - Date.now();
        const { now: _now, ...next } = remote;
        void _now;
        setState(next);
        // The server may know better than the first render (e.g. a new countdown)
        if (next.phase !== initial.phase) router.refresh();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initial.phase, router]);

  useEffect(() => {
    if (state.phase === "off") return;
    const tick = () => setNow(Date.now() + skew.current);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  const remaining = state.phase === "running" && now !== null ? state.endsAt - now : null;
  useEffect(() => {
    if (remaining !== null && remaining <= 0) {
      // Ask the server for the new phase and re-render prices
      fetch("/api/offer-timer", { method: "POST" })
        .then((response) => response.json() as Promise<Remote>)
        .then(({ now: _now, ...next }) => {
          void _now;
          setState(next);
          router.refresh();
        })
        .catch(() => router.refresh());
    }
  }, [remaining, router]);

  if (state.phase === "off") return null;

  if (state.phase === "expired") {
    return (
      <div role="status" className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
        This offer has ended. Regular prices apply for now; check back later for the next offer.
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      className="flex items-center justify-between gap-3 rounded-md border border-warning bg-surface px-4 py-3 text-sm"
    >
      <span className="font-medium">Bundle prices end in</span>
      <span className="font-mono text-lg font-semibold tabular-nums">
        {remaining === null ? "--:--" : format(remaining)}
      </span>
    </div>
  );
}
