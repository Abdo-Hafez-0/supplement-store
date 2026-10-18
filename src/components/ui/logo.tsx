import { cn } from "./cn";
import { type LogoPath, markBox, markPaths, wordmarkBox, wordmarkPaths } from "./logo-paths";

const toneClass = {
  // On light backgrounds: green + gold, as designed. On the green (inverse) sections: white + gold.
  default: { primary: "fill-accent", secondary: "fill-highlight" },
  inverse: { primary: "fill-inverse-foreground", secondary: "fill-highlight" },
} as const;

function Paths({ paths, tone }: { paths: LogoPath[]; tone: keyof typeof toneClass }) {
  return paths.map((path, index) => <path key={index} d={path.d} className={toneClass[tone][path.tone]} />);
}

// Horizontal lockup: the mark at 1.5x the wordmark height, then the wordmark.
const scale = (wordmarkBox.height * 1.5) / markBox.height;
const gap = wordmarkBox.height * 0.45;
const markWidth = markBox.width * scale;
const horizontal = { width: markWidth + gap + wordmarkBox.width, height: wordmarkBox.height * 1.5 };

/**
 * The DRIVEX logo as inline SVG, colored from design tokens. Size it with a height
 * class (e.g. "h-8"); the width follows. `variant="mark"` is the DX symbol alone.
 */
export function Logo({
  variant = "horizontal",
  tone = "default",
  decorative = false,
  className,
}: {
  variant?: "horizontal" | "stacked" | "mark";
  tone?: keyof typeof toneClass;
  /** Hidden from screen readers (e.g. a background watermark) */
  decorative?: boolean;
  className?: string;
}) {
  const common = {
    className: cn("w-auto", className),
    ...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "DRIVEX" }),
  };

  if (variant === "mark") {
    return (
      <svg viewBox={`0 0 ${markBox.width} ${markBox.height}`} {...common}>
        <Paths paths={markPaths} tone={tone} />
      </svg>
    );
  }

  if (variant === "stacked") {
    const width = Math.max(markBox.width, wordmarkBox.width);
    const space = wordmarkBox.height * 0.85;
    return (
      <svg viewBox={`0 0 ${width} ${markBox.height + space + wordmarkBox.height}`} {...common}>
        <g transform={`translate(${(width - markBox.width) / 2} 0)`}>
          <Paths paths={markPaths} tone={tone} />
        </g>
        <g transform={`translate(${(width - wordmarkBox.width) / 2} ${markBox.height + space})`}>
          <Paths paths={wordmarkPaths} tone={tone} />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${horizontal.width} ${horizontal.height}`} {...common}>
      <g transform={`scale(${scale})`}>
        <Paths paths={markPaths} tone={tone} />
      </g>
      <g transform={`translate(${markWidth + gap} ${(horizontal.height - wordmarkBox.height) / 2})`}>
        <Paths paths={wordmarkPaths} tone={tone} />
      </g>
    </svg>
  );
}
