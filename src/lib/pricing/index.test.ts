import { describe, expect, it } from "vitest";
import { lineTotalCents } from "@/lib/pricing";

// Placeholder until the pricing engine lands in M3.
describe("lineTotalCents", () => {
  it("multiplies integer cents by quantity", () => {
    expect(lineTotalCents(3499, 2)).toBe(6998);
  });

  it("rejects fractional cents", () => {
    expect(() => lineTotalCents(34.99, 2)).toThrow(TypeError);
  });
});
