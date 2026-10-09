import { describe, expect, it } from "vitest";
import {
  productFormSchema,
  shippingMethodFormSchema,
  tiersSchema,
} from "@/lib/validation/admin";
import { pickFields } from "@/lib/validation/form";

const validProduct = {
  title: "Daily Multivitamin",
  slug: "daily-multivitamin",
  shortDescription: "",
  description: "",
  regularPrice: "49.99",
  stock: "100",
  status: "active",
  isFeatured: "on",
  sortOrder: "1",
  images: JSON.stringify(["products/0b0a6c1e-0d6e-4c1f-9d0e-2a2f5e7c9b11.webp"]),
};

describe("productFormSchema", () => {
  it("parses form strings into typed values", () => {
    const result = productFormSchema.parse(validProduct);
    expect(result).toMatchObject({
      regularPrice: 4999,
      stock: 100,
      isFeatured: true,
      sortOrder: 1,
      images: ["products/0b0a6c1e-0d6e-4c1f-9d0e-2a2f5e7c9b11.webp"],
    });
  });

  it("treats a missing checkbox as false", () => {
    const rest: Partial<typeof validProduct> = { ...validProduct };
    delete rest.isFeatured;
    expect(productFormSchema.parse(rest).isFeatured).toBe(false);
  });

  it.each([
    ["regularPrice", "49.999"],
    ["regularPrice", "-1"],
    ["stock", "1.5"],
    ["stock", "-3"],
    ["slug", "Has Spaces"],
    ["status", "deleted"],
    ["isFeatured", "true"],
    ["images", JSON.stringify(["../../etc/passwd"])],
    ["images", "not json"],
  ])("rejects %s = %j", (field, value) => {
    expect(productFormSchema.safeParse({ ...validProduct, [field]: value }).success).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(productFormSchema.safeParse({ ...validProduct, priceCents: 1 }).success).toBe(false);
  });
});

describe("tiersSchema", () => {
  const tier = (bottles: number, extra = {}) => ({
    bottles,
    bundlePrice: "39.99",
    badgeLabel: "",
    isDefault: false,
    gift: null,
    ...extra,
  });

  it("accepts tiers with and without gifts", () => {
    const result = tiersSchema.parse([
      tier(1),
      tier(2, { gift: { giftProductId: 5, substituteProductId: 6, giftQty: null } }),
    ]);
    expect(result[0].bundlePrice).toBe(3999);
    expect(result[0].badgeLabel).toBeNull();
  });

  it("rejects duplicate bottle counts", () => {
    expect(tiersSchema.safeParse([tier(2), tier(2)]).success).toBe(false);
  });

  it("rejects two preselected tiers", () => {
    expect(
      tiersSchema.safeParse([tier(1, { isDefault: true }), tier(2, { isDefault: true })]).success,
    ).toBe(false);
  });

  it("rejects a substitute equal to the gift", () => {
    const gift = { giftProductId: 5, substituteProductId: 5, giftQty: null };
    expect(tiersSchema.safeParse([tier(2, { gift })]).success).toBe(false);
  });

  it("rejects prices sent as numbers", () => {
    expect(tiersSchema.safeParse([tier(1, { bundlePrice: 3999 })]).success).toBe(false);
  });
});

describe("shippingMethodFormSchema", () => {
  it("allows an empty free-over amount", () => {
    const result = shippingMethodFormSchema.parse({
      name: "Standard",
      deliveryText: "",
      price: "0",
      freeOver: "",
      sortOrder: "0",
    });
    expect(result).toMatchObject({ price: 0, freeOver: null, isActive: false });
  });
});

describe("pickFields", () => {
  it("reads only the named fields", () => {
    const form = new FormData();
    form.set("name", "Standard");
    form.set("$ACTION_ID_abc", "");
    expect(pickFields(form, ["name", "price"])).toEqual({ name: "Standard", price: undefined });
  });

  it("rejects repeated fields and files", () => {
    const repeated = new FormData();
    repeated.append("name", "a");
    repeated.append("name", "b");
    expect(() => pickFields(repeated, ["name"])).toThrow();

    const withFile = new FormData();
    withFile.set("name", new Blob(["x"]));
    expect(() => pickFields(withFile, ["name"])).toThrow();
  });
});
