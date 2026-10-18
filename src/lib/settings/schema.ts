import { z } from "zod";

// Each group is one row in the `settings` table (key + JSON value).
// Stored values are re-validated on read; anything invalid falls back to the default.

export const storefrontTextsSchema = z.strictObject({
  /** Thin bar at the top of every page */
  announcementText: z.string().trim().max(200),
  /** Promo banner on the product page */
  promoBannerText: z.string().trim().max(200),
  /**
   * Gift line shown after the promo banner, only when the product has a gift
   * available (plan: if gift and substitute are out, the banner hides the gift text).
   * Defaulted so rows saved before this field existed still parse.
   */
  promoGiftText: z.string().trim().max(120).default(""),
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

export const notificationsSchema = z.strictObject({
  /** Where the new-order alert goes; empty = no alert */
  newOrderEmail: z.union([z.literal(""), z.email().max(254)]).default(""),
});

export const MAX_FAQ_ITEMS = 12;

export const homeContentSchema = z.strictObject({
  heroTitle: z.string().trim().max(120),
  heroText: z.string().trim().max(400),
  aboutTitle: z.string().trim().max(120),
  aboutText: z.string().trim().max(3000),
  faq: z
    .array(
      z.strictObject({
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(2000),
      }),
    )
    .max(MAX_FAQ_ITEMS),
  /** Footer contacts; empty fields are hidden */
  contactEmail: z.union([z.literal(""), z.email().max(254)]),
  contactPhone: z.string().trim().max(40),
  contactAddress: z.string().trim().max(300),
  contactHours: z.string().trim().max(120),
});

export const settingsSchemas = {
  home: homeContentSchema,
  storefront: storefrontTextsSchema,
  timer: timerSchema,
  video: videoSchema,
  chat: chatSchema,
  limits: limitsSchema,
  notifications: notificationsSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };

export const defaultSettings: Settings = {
  home: {
    heroTitle: "Supplements that keep up with you",
    heroText: "Quality formulas, bundle savings and free gifts on multi-bottle orders.",
    aboutTitle: "About us",
    aboutText: "",
    faq: [],
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    contactHours: "",
  },
  storefront: {
    announcementText: "",
    promoBannerText: "",
    promoGiftText: "",
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
  notifications: { newOrderEmail: "" },
};
