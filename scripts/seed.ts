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
          name: `${SAMPLE} Shaker Bottle`,
          shortDescription: "Sample gift product.",
          regularPriceCents: 1299,
          stock: 50,
          isListed: false,
          sortOrder: 90,
        },
        {
          slug: "sample-pill-organizer",
          name: `${SAMPLE} Pill Organizer`,
          shortDescription: "Sample substitute gift, used when the shaker is out of stock.",
          regularPriceCents: 999,
          stock: 50,
          isListed: false,
          sortOrder: 91,
        },
      ])
      .returning();

    const mainProducts = await db
      .insert(products)
      .values([
        {
          slug: "sample-daily-multivitamin",
          name: `${SAMPLE} Daily Multivitamin`,
          shortDescription: "Sample product for the prototype. Not a real item.",
          description: "Sample description. Replace with real product copy in the admin.",
          regularPriceCents: 3999,
          compareAtPriceCents: 4999,
          stock: 100,
          sortOrder: 1,
          bannerText: "Sample banner: free gift with 2+ bottles",
        },
        {
          slug: "sample-magnesium-sleep",
          name: `${SAMPLE} Magnesium Sleep Support`,
          shortDescription: "Sample product for the prototype. Not a real item.",
          description: "Sample description. Replace with real product copy in the admin.",
          regularPriceCents: 3499,
          stock: 100,
          sortOrder: 2,
        },
      ])
      .returning();

    for (const product of mainProducts) {
      const base = product.regularPriceCents;
      const tiers = await db
        .insert(productTiers)
        .values([
          { productId: product.id, bottles: 1, unitPriceCents: base, sortOrder: 1 },
          {
            productId: product.id,
            bottles: 2,
            unitPriceCents: base - 500,
            label: "Popular",
            isDefault: true,
            sortOrder: 2,
          },
          {
            productId: product.id,
            bottles: 3,
            unitPriceCents: base - 1000,
            label: "Best value",
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
            giftText: `${SAMPLE} Free shaker bottle`,
          })),
      );
    }

    await db.insert(orderBumps).values({
      productId: organizer.id,
      headline: `${SAMPLE} Add a pill organizer for $4.99`,
      description: "Sample order bump shown at checkout.",
      priceCents: 499,
    });

    await db.insert(shippingMethods).values({
      name: `${SAMPLE} Free shipping`,
      description: "Sample free shipping method, 5-7 business days.",
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
