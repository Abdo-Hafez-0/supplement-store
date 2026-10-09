import { describe, expect, it } from "vitest";
import { defaultSettings, settingsSchemas } from "@/lib/settings/schema";

describe("settings schemas", () => {
  it("accept their own defaults", () => {
    for (const [key, schema] of Object.entries(settingsSchemas)) {
      expect(schema.safeParse(defaultSettings[key as keyof typeof defaultSettings]).success).toBe(true);
    }
  });

  it("default the timer to the plan's expiry rule", () => {
    expect(defaultSettings.timer).toMatchObject({
      expiryBehavior: "regular_price_then_restart",
      regularPriceHours: 24,
    });
  });

  it("reject more than 4 trust badges", () => {
    const value = { ...defaultSettings.storefront, trustBadges: ["a", "b", "c", "d", "e"] };
    expect(settingsSchemas.storefront.safeParse(value).success).toBe(false);
  });
});
