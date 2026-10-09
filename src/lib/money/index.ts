// Money is integer cents everywhere (CLAUDE.md rule 1). These helpers convert
// between cents and the dollar strings admins type, without floating point.

const DOLLARS = /^\$?\s*(\d{1,6})(?:\.(\d{1,2}))?$/;

/** Parses "39", "39.9", "39.99" or "$39.99" into cents. Returns null for anything else. */
export function parseDollarsToCents(input: string): number | null {
  const match = DOLLARS.exec(input.trim().replaceAll(",", ""));
  if (!match) return null;
  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** 3999 -> "39.99" (for form inputs) */
export function centsToDollarInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 3999 -> "$39.99" (for display) */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}
