import { describe, expect, it } from "vitest";
import { checkoutDetailsSchema, formatUsPhone, normalizeUsPhone } from "./checkout";

const valid = {
  email: "  Jane.Doe@Example.com ",
  phone: "(212) 555-0100",
  name: "Jane Doe",
  line1: "1 Main St",
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  shippingMethodId: 1,
};

describe("checkoutDetailsSchema", () => {
  it("accepts a valid US order and normalizes email and phone", () => {
    const parsed = checkoutDetailsSchema.parse(valid);
    expect(parsed.email).toBe("jane.doe@example.com");
    expect(parsed.phone).toBe("2125550100");
    expect(parsed.line2).toBe("");
  });

  it("requires the phone number", () => {
    const { phone: _phone, ...rest } = valid;
    void _phone;
    expect(checkoutDetailsSchema.safeParse(rest).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
  });

  it("rejects non-US states, bad ZIP codes and invalid emails", () => {
    expect(checkoutDetailsSchema.safeParse({ ...valid, state: "ON" }).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...valid, postalCode: "1234" }).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...valid, postalCode: "62701-1234" }).success).toBe(true);
    expect(checkoutDetailsSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects unexpected fields, including prices", () => {
    expect(checkoutDetailsSchema.safeParse({ ...valid, totalCents: 1 }).success).toBe(false);
  });

  it("rejects a shipping method id that is not a positive integer", () => {
    expect(checkoutDetailsSchema.safeParse({ ...valid, shippingMethodId: "1" }).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...valid, shippingMethodId: 1.5 }).success).toBe(false);
  });
});

describe("US phone numbers", () => {
  it("accepts common formats and a leading 1", () => {
    expect(normalizeUsPhone("212-555-0100")).toBe("2125550100");
    expect(normalizeUsPhone("+1 212 555 0100")).toBe("2125550100");
  });

  it("rejects letters, short numbers and invalid area codes", () => {
    expect(normalizeUsPhone("212-555-01OO")).toBeNull();
    expect(normalizeUsPhone("555-0100")).toBeNull();
    expect(normalizeUsPhone("012-555-0100")).toBeNull();
  });

  it("formats for display", () => {
    expect(formatUsPhone("2125550100")).toBe("(212) 555-0100");
  });
});
