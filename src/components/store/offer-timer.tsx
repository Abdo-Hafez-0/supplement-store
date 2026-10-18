"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClockIcon } from "@/components/ui/icons";
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
      <div role="status" className="flex items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm text-muted">
        <ClockIcon />
        This offer has ended. Regular prices apply for now; check back later for the next offer.
      </div>
    );
  }

  const parts = (remaining === null ? "--:--" : format(remaining)).split(":");
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Bundle prices end in ${parts.join(":")}`}
      className="flex items-center justify-between gap-3 rounded-lg bg-inverse px-4 py-3 text-inverse-foreground"
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <ClockIcon className="size-5 text-highlight" />
        Bundle prices end in
      </span>
      <span aria-hidden className="flex items-center gap-1 font-heading text-lg font-bold tabular-nums">
        {parts.map((part, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-highlight">:</span>}
            <span className="min-w-9 rounded-sm bg-inverse-border px-1.5 py-0.5 text-center">{part}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
