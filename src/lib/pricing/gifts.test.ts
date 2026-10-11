import { describe, expect, it } from "vitest";
import { giftQuantity, resolveGift, type GiftCandidate } from "@/lib/pricing";

const product = (id: number, stock: number, status: GiftCandidate["status"] = "unlisted"): GiftCandidate => ({
  id,
  title: `Product ${id}`,
  stock,
  status,
});

const rule = { giftProductId: 10, substituteProductId: 11, giftQty: null };

describe("giftQuantity", () => {
  it("defaults to bottles - 1 and can be overridden", () => {
    expect(giftQuantity(3, { giftQty: null })).toBe(2);
    expect(giftQuantity(1, { giftQty: null })).toBe(0);
    expect(giftQuantity(3, { giftQty: 1 })).toBe(1);
  });
});

describe("resolveGift", () => {
  it("gives the gift when it has stock", () => {
    const products = new Map([[10, product(10, 50)], [11, product(11, 50)]]);
    expect(resolveGift(3, rule, products)).toMatchObject({ product: { id: 10 }, quantity: 2, isSubstitute: false });
  });

  it("uses the substitute when the gift is out of stock", () => {
    const products = new Map([[10, product(10, 0)], [11, product(11, 50)]]);
    expect(resolveGift(3, rule, products)).toMatchObject({ product: { id: 11 }, isSubstitute: true });
  });

  it("uses the substitute when the gift has less stock than the gift quantity", () => {
    const products = new Map([[10, product(10, 1)], [11, product(11, 5)]]);
    expect(resolveGift(3, rule, products)?.product.id).toBe(11);
  });

  it("gives no gift when both are out of stock", () => {
    const products = new Map([[10, product(10, 0)], [11, product(11, 0)]]);
    expect(resolveGift(3, rule, products)).toBeNull();
  });

  it("gives no gift when there is no substitute and the gift is out", () => {
    const products = new Map([[10, product(10, 0)]]);
    expect(resolveGift(3, { ...rule, substituteProductId: null }, products)).toBeNull();
  });

  it("treats draft products as unavailable", () => {
    const products = new Map([[10, product(10, 50, "draft")], [11, product(11, 50)]]);
    expect(resolveGift(3, rule, products)?.product.id).toBe(11);
  });

  it("gives no gift when the quantity is zero (1 bottle, default rule)", () => {
    const products = new Map([[10, product(10, 50)]]);
    expect(resolveGift(1, rule, products)).toBeNull();
  });

  it("gives no gift for a tier without a gift rule", () => {
    expect(resolveGift(3, null, new Map())).toBeNull();
  });
});
