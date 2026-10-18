// Email clients don't support CSS variables, so emails get literal colors. They mirror
// the design tokens in src/app/globals.css: change both together when the brand changes.
export const emailTheme = {
  background: "#f7f6f1", // --background
  surface: "#ffffff", // --surface
  border: "#e2dfd5", // --border
  text: "#16211e", // --text
  muted: "#5b6863", // --muted
  accent: "#123f36", // --accent (brand green)
  accentForeground: "#ffffff", // --accent-foreground
  highlight: "#c49a44", // --highlight (brand gold)
  highlightSoft: "#f7efdc", // --highlight-soft
  highlightText: "#84621f", // --highlight-text
  inverseMuted: "#c3d3cd", // --inverse-muted
  font: "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  headingFont: "Poppins, Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;
