import { describe, expect, it } from "vitest";
import { centsToDollarInput, formatCents, parseDollarsToCents } from "@/lib/money";

describe("parseDollarsToCents", () => {
  it.each([
    ["39.99", 3999],
    ["39.9", 3990],
    ["39", 3900],
    ["$39.99", 3999],
    [" 0.05 ", 5],
    ["1,299.00", 129900],
    ["0", 0],
  ])("%s -> %i", (input, cents) => {
    expect(parseDollarsToCents(input)).toBe(cents);
  });

  it("avoids float rounding errors", () => {
    // 0.29 * 100 === 28.999999999999996 in floating point
    expect(parseDollarsToCents("0.29")).toBe(29);
    expect(parseDollarsToCents("19.99")).toBe(1999);
  });

  it.each(["", "abc", "1.999", "-5", "1e3", "12.", ".5", "1234567"])("rejects %j", (input) => {
    expect(parseDollarsToCents(input)).toBeNull();
  });
});

describe("centsToDollarInput", () => {
  it.each([
    [3999, "39.99"],
    [5, "0.05"],
    [0, "0.00"],
    [100000, "1000.00"],
  ])("%i -> %s", (cents, text) => {
    expect(centsToDollarInput(cents)).toBe(text);
  });

  it("round-trips with parseDollarsToCents", () => {
    for (const cents of [0, 1, 99, 100, 3999, 123456]) {
      expect(parseDollarsToCents(centsToDollarInput(cents))).toBe(cents);
    }
  });
});

describe("formatCents", () => {
  it("formats US dollars", () => {
    expect(formatCents(3999)).toBe("$39.99");
    expect(formatCents(129900)).toBe("$1,299.00");
  });
});
