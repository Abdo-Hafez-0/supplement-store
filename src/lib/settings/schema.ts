import { z } from "zod";

// Each group is one row in the `settings` table (key + JSON value).
// Stored values are re-validated on read; anything invalid falls back to the default.

export const storefrontTextsSchema = z.strictObject({
  /** Thin bar at the top of every page */
  announcementText: z.string().trim().max(200),
  /** Promo banner on the product page */
  promoBannerText: z.string().trim().max(200),
  /** Shown on tier cards that include a gift, e.g. "FREE GIFT" */
  giftBadgeText: z.string().trim().max(40),
  /** Free-shipping callout on the product page and cart */
  freeShippingText: z.string().trim().max(200),
  /** Trust badges at checkout, up to 4 */
  trustBadges: z.array(z.string().trim().min(1).max(60)).max(4),
});

export const timerExpiryBehaviors = ["regular_price_then_restart", "restart_immediately"] as const;

export const timerSchema = z.strictObject({
  enabled: z.boolean(),
  /** Countdown length per visitor */
  durationMinutes: z.number().int().min(1).max(1440),
  /**
   * What happens at zero. Default (plan open question): bundle prices end and the
   * regular price applies for `regularPriceHours`, then the timer restarts.
   */
  expiryBehavior: z.enum(timerExpiryBehaviors),
  regularPriceHours: z.number().int().min(1).max(168),
});

export const videoSchema = z.strictObject({
  /** R2 key of the shared how-to video, shown on every product page */
  fileKey: z.string().regex(/^video\/[a-z0-9-]{36}\.mp4$/).nullable(),
  title: z.string().trim().max(120),
});

export const chatSchema = z.strictObject({
  /** Live chat widget ID; the provider is chosen in M5 */
  chatId: z.string().trim().max(100),
});

export const limitsSchema = z.strictObject({
  /** Maximum quantity per cart line; null = no cap (plan default) */
  maxQuantityPerLine: z.number().int().min(1).max(999).nullable(),
});

export const settingsSchemas = {
  storefront: storefrontTextsSchema,
  timer: timerSchema,
  video: videoSchema,
  chat: chatSchema,
  limits: limitsSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };

export const defaultSettings: Settings = {
  storefront: {
    announcementText: "",
    promoBannerText: "",
    giftBadgeText: "FREE GIFT",
    freeShippingText: "Free shipping on every order",
    trustBadges: [],
  },
  timer: {
    enabled: false,
    durationMinutes: 15,
    expiryBehavior: "regular_price_then_restart",
    regularPriceHours: 24,
  },
  video: { fileKey: null, title: "How to use" },
  chat: { chatId: "" },
  limits: { maxQuantityPerLine: null },
};
