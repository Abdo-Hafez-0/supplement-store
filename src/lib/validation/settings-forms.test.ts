import { describe, expect, it } from "vitest";
import { settingsSchemas } from "@/lib/settings/schema";
import { settingsFormSchemas } from "@/lib/validation/settings-forms";

describe("settings form schemas", () => {
  it("collects non-empty trust badges in order", () => {
    const value = settingsFormSchemas.storefront.parse({
      announcementText: " Summer sale ",
      trustBadge1: "Secure checkout",
      trustBadge2: "",
      trustBadge3: "Made in the USA",
    });
    expect(value).toEqual({
      announcementText: "Summer sale",
      promoBannerText: "",
      giftBadgeText: "",
      freeShippingText: "",
      trustBadges: ["Secure checkout", "Made in the USA"],
    });
    expect(settingsSchemas.storefront.safeParse(value).success).toBe(true);
  });

  it("parses the timer form", () => {
    expect(
      settingsFormSchemas.timer.parse({
        enabled: "on",
        durationMinutes: "15",
        expiryBehavior: "regular_price_then_restart",
        regularPriceHours: "24",
      }),
    ).toEqual({ enabled: true, durationMinutes: 15, expiryBehavior: "regular_price_then_restart", regularPriceHours: 24 });
  });

  it("rejects a timer longer than a day", () => {
    const result = settingsFormSchemas.timer.safeParse({
      durationMinutes: "1441",
      expiryBehavior: "restart_immediately",
      regularPriceHours: "24",
    });
    expect(result.success).toBe(false);
  });

  it("treats an empty video key as no video and rejects foreign keys", () => {
    expect(settingsFormSchemas.video.parse({ fileKey: "", title: "How to use" }).fileKey).toBeNull();
    expect(settingsFormSchemas.video.safeParse({ fileKey: "products/x.png", title: "" }).success).toBe(false);
  });

  it("treats an empty quantity cap as no cap", () => {
    expect(settingsFormSchemas.limits.parse({ maxQuantityPerLine: "" })).toEqual({ maxQuantityPerLine: null });
    expect(settingsFormSchemas.limits.parse({ maxQuantityPerLine: "6" })).toEqual({ maxQuantityPerLine: 6 });
    expect(settingsFormSchemas.limits.safeParse({ maxQuantityPerLine: "0" }).success).toBe(false);
  });
});
