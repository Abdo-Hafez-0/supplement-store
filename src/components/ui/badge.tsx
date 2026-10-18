import type { ReactNode } from "react";
import { cn } from "./cn";

const tones = {
  /** Gold: savings, offers */
  highlight: "bg-highlight text-highlight-foreground",
  /** Green: labels like "Most popular" */
  accent: "bg-accent text-accent-foreground",
  /** Soft gold: gifts */
  gift: "bg-highlight-soft text-highlight-text ring-1 ring-highlight",
  success: "bg-success text-success-foreground",
  neutral: "bg-surface-muted text-text",
  outline: "text-muted ring-1 ring-border",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
