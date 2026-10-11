import { z } from "zod";
import { homeContentSchema, timerExpiryBehaviors, type Settings, type SettingsKey } from "@/lib/settings/schema";
import { checkbox, intString, optionalIntString } from "./admin";

// Form fields (strings) -> typed settings values. The stored value is validated
// again by the settings schema in saveSetting().

const text = (max: number) => z.string().trim().max(max).default("");

const json = z.string().transform((value, ctx) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    ctx.addIssue({ code: "custom", message: "Could not read the list. Reload the page and try again." });
    return z.NEVER;
  }
});

export const settingsFormSchemas = {
  home: z.strictObject({
    heroTitle: text(120),
    heroText: text(400),
    aboutTitle: text(120),
    aboutText: text(3000),
    faq: json.pipe(homeContentSchema.shape.faq),
    contactEmail: z
      .string()
      .trim()
      .default("")
      .pipe(z.union([z.literal(""), z.email("Enter a valid email, or leave empty").max(254)])),
    contactPhone: text(40),
    contactAddress: text(300),
    contactHours: text(120),
  }),
  storefront: z
    .strictObject({
      announcementText: text(200),
      promoBannerText: text(200),
      promoGiftText: text(120),
      giftBadgeText: text(40),
      freeShippingText: text(200),
      trustBadge1: text(60),
      trustBadge2: text(60),
      trustBadge3: text(60),
      trustBadge4: text(60),
    })
    .transform(
      ({ trustBadge1, trustBadge2, trustBadge3, trustBadge4, ...rest }): Settings["storefront"] => ({
        ...rest,
        trustBadges: [trustBadge1, trustBadge2, trustBadge3, trustBadge4].filter(Boolean),
      }),
    ),
  timer: z.strictObject({
    enabled: checkbox,
    durationMinutes: intString(1, 1440),
    expiryBehavior: z.enum(timerExpiryBehaviors),
    regularPriceHours: intString(1, 168),
  }),
  video: z
    .strictObject({
      fileKey: z
        .string()
        .default("")
        .transform((value) => value || null)
        .pipe(z.string().regex(/^video\/[a-z0-9-]{36}\.mp4$/, "Invalid video").nullable()),
      title: text(120),
    }),
  chat: z.strictObject({ chatId: text(100) }),
  limits: z.strictObject({ maxQuantityPerLine: optionalIntString(1, 999) }),
} satisfies { [K in SettingsKey]: z.ZodType<Settings[K], unknown> };

export const settingsFormFields: { [K in SettingsKey]: string[] } = {
  home: [
    "heroTitle",
    "heroText",
    "aboutTitle",
    "aboutText",
    "faq",
    "contactEmail",
    "contactPhone",
    "contactAddress",
    "contactHours",
  ],
  storefront: [
    "announcementText",
    "promoBannerText",
    "promoGiftText",
    "giftBadgeText",
    "freeShippingText",
    "trustBadge1",
    "trustBadge2",
    "trustBadge3",
    "trustBadge4",
  ],
  timer: ["enabled", "durationMinutes", "expiryBehavior", "regularPriceHours"],
  video: ["fileKey", "title"],
  chat: ["chatId"],
  limits: ["maxQuantityPerLine"],
};
