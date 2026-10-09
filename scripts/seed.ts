/**
 * LOCAL ONLY: inserts clearly labelled sample data into the local D1 database.
 * Run with `npm run db:seed:local`. Safe to re-run: it replaces earlier sample rows.
 *
 * Bindings come from getPlatformProxy with remote bindings turned off, so this
 * script cannot reach the deployed database.
 */
import { drizzle } from "drizzle-orm/d1";
import { inArray, like, or } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";
import * as schema from "../src/lib/db/schema";

const SAMPLE = "[Sample]";

async function main() {
  const { env, dispose } = await getPlatformProxy<CloudflareEnv>({ remoteBindings: false });
  try {
    const db = drizzle(env.DB, { schema });
    const { products, productTiers, tierGifts, orderBumps, shippingMethods } = schema;

    // Remove earlier sample rows. Tiers and gifts cascade from their products;
    // gift rows go first because they restrict deleting the gift products.
    const sampleProductIds = db
      .select({ id: products.id })
      .from(products)
      .where(like(products.slug, "sample-%"));
    await db
      .delete(tierGifts)
      .where(
        or(
          inArray(tierGifts.giftProductId, sampleProductIds),
          inArray(
            tierGifts.tierId,
            db
              .select({ id: productTiers.id })
              .from(productTiers)
              .where(inArray(productTiers.productId, sampleProductIds)),
          ),
        ),
      );
    await db.delete(products).where(like(products.slug, "sample-%"));
    await db.delete(shippingMethods).where(like(shippingMethods.name, `${SAMPLE}%`));

    const [shaker, organizer] = await db
      .insert(products)
      .values([
        {
          slug: "sample-shaker-bottle",
          title: `${SAMPLE} Shaker Bottle`,
          shortDescription: "Sample gift product.",
          regularPriceCents: 1299,
          stock: 50,
          status: "unlisted",
          sortOrder: 90,
        },
        {
          slug: "sample-pill-organizer",
          title: `${SAMPLE} Pill Organizer`,
          shortDescription: "Sample substitute gift, used when the shaker is out of stock.",
          regularPriceCents: 999,
          stock: 50,
          status: "unlisted",
          sortOrder: 91,
        },
      ])
      .returning();

    // Regular price is the struck-through price; tiers are bundle prices.
    const mainProducts = await db
      .insert(products)
      .values([
        {
          slug: "sample-daily-multivitamin",
          title: `${SAMPLE} Daily Multivitamin`,
          shortDescription: "Sample product for the prototype. Not a real item.",
          description: "Sample description. Replace with real product copy in the admin.",
          regularPriceCents: 4999,
          stock: 100,
          status: "active",
          isFeatured: true,
          sortOrder: 1,
        },
        {
          slug: "sample-magnesium-sleep",
          title: `${SAMPLE} Magnesium Sleep Support`,
          shortDescription: "Sample product for the prototype. Not a real item.",
          description: "Sample description. Replace with real product copy in the admin.",
          regularPriceCents: 4499,
          stock: 100,
          status: "active",
          sortOrder: 2,
        },
      ])
      .returning();

    for (const product of mainProducts) {
      const one = product.regularPriceCents - 1000;
      const tiers = await db
        .insert(productTiers)
        .values([
          { productId: product.id, bottles: 1, bundlePriceCents: one, sortOrder: 1 },
          {
            productId: product.id,
            bottles: 2,
            bundlePriceCents: one * 2 - 1000,
            badgeLabel: "Popular",
            isDefault: true,
            sortOrder: 2,
          },
          {
            productId: product.id,
            bottles: 3,
            bundlePriceCents: one * 3 - 2500,
            badgeLabel: "Best value",
            sortOrder: 3,
          },
        ])
        .returning();

      // 1 bottle earns no gift (bottles - 1 = 0); 2 and 3 bottles get the shaker,
      // or the organizer when the shaker is out of stock.
      await db.insert(tierGifts).values(
        tiers
          .filter((tier) => tier.bottles > 1)
          .map((tier) => ({
            tierId: tier.id,
            giftProductId: shaker.id,
            substituteProductId: organizer.id,
          })),
      );

      // Each product offers the pill organizer as its checkout bump.
      await db.insert(orderBumps).values({
        productId: product.id,
        bumpProductId: organizer.id,
        bumpPriceCents: 499,
        headline: `${SAMPLE} Add a pill organizer for $4.99`,
      });
    }

    await db.insert(shippingMethods).values({
      name: `${SAMPLE} Free shipping`,
      deliveryText: "Sample: arrives in 5-7 business days",
      priceCents: 0,
      sortOrder: 1,
    });

    const count = (await db.select({ id: products.id }).from(products)).length;
    console.log(`Seeded sample data. Products in local D1: ${count}`);
  } finally {
    await dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
