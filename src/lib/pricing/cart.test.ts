import { describe, expect, it } from "vitest";
import { priceCart, type CatalogProduct, type CartLineInput } from "@/lib/pricing";

// Catalog: a multivitamin with 1/2/3-bottle tiers whose 2- and 3-bottle tiers give
// a shaker (substitute: pill organizer), a magnesium with the same gift, a product
// without tiers, and the two gift products themselves.
const SHAKER = 10;
const ORGANIZER = 11;

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "id">): CatalogProduct {
  return {
    title: `Product ${overrides.id}`,
    slug: `product-${overrides.id}`,
    status: "active",
    stock: 100,
    regularPriceCents: 4999,
    images: [],
    tiers: [],
    ...overrides,
  };
}

const giftRule = { giftProductId: SHAKER, substituteProductId: ORGANIZER, giftQty: null };
const tiered = (id: number) =>
  product({
    id,
    tiers: [
      { bottles: 1, bundlePriceCents: 3999, gift: null },
      { bottles: 2, bundlePriceCents: 6999, gift: giftRule },
      { bottles: 3, bundlePriceCents: 8999, gift: giftRule },
    ],
  });

function catalog(...products: CatalogProduct[]) {
  const base = [
    tiered(1),
    tiered(2),
    product({ id: 3, regularPriceCents: 2500 }),
    product({ id: SHAKER, title: "Shaker", status: "unlisted", stock: 50, regularPriceCents: 1299 }),
    product({ id: ORGANIZER, title: "Organizer", status: "unlisted", stock: 50, regularPriceCents: 999 }),
  ];
  const map = new Map(base.map((p) => [p.id, p]));
  for (const p of products) map.set(p.id, p);
  return map;
}

const line = (id: number, productId: number, quantity: number): CartLineInput => ({ id, productId, quantity });
const options = { offerActive: true, maxQuantityPerLine: null };

describe("priceCart: prices", () => {
  it("sells a product without tiers at its regular price", () => {
    const cart = priceCart([line(1, 3, 2)], catalog(), options);
    expect(cart.lines[0]).toMatchObject({ lineTotalCents: 5000, unitPriceCents: 2500, tierBottles: null, gift: null });
  });

  it("takes the tier price from the real line quantity", () => {
    const one = priceCart([line(1, 1, 1)], catalog(), options).lines[0];
    const three = priceCart([line(1, 1, 3)], catalog(), options).lines[0];
    expect(one).toMatchObject({ lineTotalCents: 3999, tierBottles: 1 });
    expect(three).toMatchObject({ lineTotalCents: 8999, tierBottles: 3, unitPriceCents: 3000 });
  });

  it("re-prices when the quantity changes (2 bottles -> 1 bottle)", () => {
    expect(priceCart([line(1, 1, 2)], catalog(), options).lines[0].lineTotalCents).toBe(6999);
    expect(priceCart([line(1, 1, 1)], catalog(), options).lines[0].lineTotalCents).toBe(3999);
  });

  it("above the top tier charges the top tier's rounded per-bottle price x quantity", () => {
    // 8999 / 3 = 2999.67 -> 3000 per bottle
    expect(priceCart([line(1, 1, 5)], catalog(), options).lines[0]).toMatchObject({ lineTotalCents: 15000, tierBottles: 3 });
  });

  it("charges regular prices while the offer has expired", () => {
    const cart = priceCart([line(1, 1, 3)], catalog(), { ...options, offerActive: false });
    expect(cart.lines[0]).toMatchObject({ lineTotalCents: 14997, tierBottles: null });
    expect(cart.savingsCents).toBe(0);
  });

  it("totals the cart and the savings", () => {
    const cart = priceCart([line(1, 1, 3), line(2, 3, 1)], catalog(), options);
    expect(cart.subtotalCents).toBe(8999 + 2500);
    expect(cart.compareAtTotalCents).toBe(14997 + 2500);
    expect(cart.savingsCents).toBe(5998);
  });
});

describe("priceCart: gifts", () => {
  it("gives bottles - 1 gifts by default", () => {
    expect(priceCart([line(1, 1, 1)], catalog(), options).lines[0].gift).toBeNull();
    expect(priceCart([line(1, 1, 2)], catalog(), options).lines[0].gift).toMatchObject({ productId: SHAKER, quantity: 1 });
    expect(priceCart([line(1, 1, 3)], catalog(), options).lines[0].gift).toMatchObject({ productId: SHAKER, quantity: 2 });
  });

  it("removes the gift when going back to 1 bottle", () => {
    expect(priceCart([line(1, 1, 3)], catalog(), options).lines[0].gift).not.toBeNull();
    expect(priceCart([line(1, 1, 1)], catalog(), options).lines[0].gift).toBeNull();
  });

  it("uses the tier's gift quantity override", () => {
    const custom = product({
      id: 1,
      tiers: [{ bottles: 3, bundlePriceCents: 8999, gift: { ...giftRule, giftQty: 1 } }],
    });
    expect(priceCart([line(1, 1, 3)], catalog(custom), options).lines[0].gift?.quantity).toBe(1);
  });

  it("above the top tier gives quantity - 1 gifts", () => {
    expect(priceCart([line(1, 1, 5)], catalog(), options).lines[0].gift).toMatchObject({ productId: SHAKER, quantity: 4 });
  });

  it("keeps gifts for different products as separate lines, even for the same gift", () => {
    const cart = priceCart([line(1, 1, 2), line(2, 2, 3)], catalog(), options);
    expect(cart.lines.map((l) => l.gift)).toMatchObject([
      { productId: SHAKER, quantity: 1 },
      { productId: SHAKER, quantity: 2 },
    ]);
    expect(cart.itemCount).toBe(2 + 1 + 3 + 2);
  });

  it("uses the substitute when the gift is out of stock", () => {
    const cart = priceCart([line(1, 1, 3)], catalog(product({ id: SHAKER, status: "unlisted", stock: 0 })), options);
    expect(cart.lines[0].gift).toMatchObject({ productId: ORGANIZER, quantity: 2, isSubstitute: true });
  });

  it("gives no gift when the gift and the substitute are both out", () => {
    const cart = priceCart(
      [line(1, 1, 3)],
      catalog(product({ id: SHAKER, status: "unlisted", stock: 0 }), product({ id: ORGANIZER, status: "unlisted", stock: 0 })),
      options,
    );
    expect(cart.lines[0].gift).toBeNull();
  });

  it("shares gift stock between lines: the second line falls back to the substitute", () => {
    const cart = priceCart(
      [line(1, 1, 3), line(2, 2, 3)],
      catalog(product({ id: SHAKER, status: "unlisted", stock: 3 })),
      options,
    );
    expect(cart.lines[0].gift).toMatchObject({ productId: SHAKER, quantity: 2 });
    expect(cart.lines[1].gift).toMatchObject({ productId: ORGANIZER, quantity: 2 });
  });

  it("charges a gift product added by itself in full, and gives it no stock away", () => {
    const cart = priceCart(
      [line(1, SHAKER, 2), line(2, 1, 3)],
      catalog(product({ id: SHAKER, title: "Shaker", status: "unlisted", stock: 3, regularPriceCents: 1299 })),
      options,
    );
    expect(cart.lines[0]).toMatchObject({ productId: SHAKER, lineTotalCents: 2598, gift: null });
    // 3 shakers in stock, 2 sold: only 1 left, so the 2-gift goes to the substitute
    expect(cart.lines[1].gift).toMatchObject({ productId: ORGANIZER, quantity: 2 });
  });

  it("still gives gifts while the offer timer has expired", () => {
    const cart = priceCart([line(1, 1, 3)], catalog(), { ...options, offerActive: false });
    expect(cart.lines[0].gift).toMatchObject({ productId: SHAKER, quantity: 2 });
  });
});

describe("priceCart: corrections", () => {
  it("drops draft and deleted products", () => {
    const cart = priceCart([line(1, 1, 1), line(2, 99, 1)], catalog(product({ id: 1, status: "draft" })), options);
    expect(cart.lines).toHaveLength(0);
    expect(cart.removed.map((r) => r.reason)).toEqual(["unavailable", "unavailable"]);
  });

  it("drops out-of-stock products", () => {
    const cart = priceCart([line(1, 3, 1)], catalog(product({ id: 3, stock: 0 })), options);
    expect(cart.removed).toEqual([{ lineId: 1, productId: 3, title: "Product 3", reason: "out_of_stock" }]);
  });

  it("lowers the quantity to the stock and to the cart cap", () => {
    expect(priceCart([line(1, 3, 9)], catalog(product({ id: 3, stock: 4 })), options).lines[0]).toMatchObject({
      quantity: 4,
      issues: ["reduced_to_stock"],
    });
    expect(priceCart([line(1, 3, 9)], catalog(), { ...options, maxQuantityPerLine: 6 }).lines[0]).toMatchObject({
      quantity: 6,
      issues: ["reduced_to_max"],
    });
  });

  it("never returns float prices", () => {
    const cart = priceCart([line(1, 1, 7), line(2, 2, 4), line(3, 3, 3)], catalog(), options);
    for (const l of cart.lines) {
      expect(Number.isInteger(l.lineTotalCents)).toBe(true);
      expect(Number.isInteger(l.unitPriceCents)).toBe(true);
    }
  });
});

describe("priceCart: order bump", () => {
  const BUMP = 20;
  const withBumps = () =>
    catalog(
      { ...tiered(1), bump: { bumpProductId: BUMP, bumpPriceCents: 599, headline: "Add a shaker" } },
      { ...tiered(2), bump: { bumpProductId: ORGANIZER, bumpPriceCents: 499, headline: "Add an organizer" } },
      product({ id: BUMP, title: "Bump item", status: "unlisted", stock: 10, regularPriceCents: 1299 }),
    );

  it("offers the bump of the product in the cart, not yet accepted", () => {
    const cart = priceCart([line(1, 1, 1)], withBumps(), options);
    expect(cart.bump).toMatchObject({ triggerProductId: 1, productId: BUMP, priceCents: 599, compareAtCents: 1299, accepted: false });
    expect(cart.subtotalCents).toBe(3999);
  });

  it("offers the bump of the product with the highest line total", () => {
    // product 2 x3 = 89.99 beats product 1 x1 = 39.99
    const cart = priceCart([line(1, 1, 1), line(2, 2, 3)], withBumps(), options);
    expect(cart.bump).toMatchObject({ triggerProductId: 2, productId: ORGANIZER, priceCents: 499 });
  });

  it("adds an accepted bump at the bump price: one item, no tiers or gifts", () => {
    const cart = priceCart([line(1, 1, 1)], withBumps(), { ...options, acceptedBump: { id: 9, productId: BUMP } });
    expect(cart.bump).toMatchObject({ accepted: true, lineId: 9 });
    expect(cart.subtotalCents).toBe(3999 + 599);
    expect(cart.compareAtTotalCents).toBe(4999 + 1299);
    expect(cart.itemCount).toBe(2);
    expect(cart.staleBumpLineId).toBeNull();
  });

  it("drops an accepted bump that no longer applies", () => {
    // The accepted bump was product 1's; now product 2 leads, offering a different item
    const cart = priceCart([line(1, 1, 1), line(2, 2, 3)], withBumps(), {
      ...options,
      acceptedBump: { id: 9, productId: BUMP },
    });
    expect(cart.bump).toMatchObject({ productId: ORGANIZER, accepted: false });
    expect(cart.staleBumpLineId).toBe(9);
    expect(cart.subtotalCents).toBe(3999 + 8999);
  });

  it("drops the bump when its product is removed from the cart", () => {
    const cart = priceCart([line(2, 3, 1)], withBumps(), { ...options, acceptedBump: { id: 9, productId: BUMP } });
    expect(cart.bump).toBeNull();
    expect(cart.staleBumpLineId).toBe(9);
  });

  it("offers no bump when the offered product is out of stock or a draft", () => {
    const out = withBumps();
    out.set(BUMP, product({ id: BUMP, status: "unlisted", stock: 0 }));
    expect(priceCart([line(1, 1, 1)], out, options).bump).toBeNull();
    const draft = withBumps();
    draft.set(BUMP, product({ id: BUMP, status: "draft" }));
    expect(priceCart([line(1, 1, 1)], draft, options).bump).toBeNull();
  });

  it("takes the bumped item's stock before gifts", () => {
    // Organizer is product 2's bump and the substitute gift; 2 left in stock
    const c = withBumps();
    c.set(SHAKER, product({ id: SHAKER, status: "unlisted", stock: 0 }));
    c.set(ORGANIZER, product({ id: ORGANIZER, title: "Organizer", status: "unlisted", stock: 2, regularPriceCents: 999 }));
    const cart = priceCart([line(1, 2, 3)], c, { ...options, acceptedBump: { id: 9, productId: ORGANIZER } });
    expect(cart.bump?.accepted).toBe(true);
    // 2 gifts needed, only 1 organizer left after the bump: no gift
    expect(cart.lines[0].gift).toBeNull();
  });
});
