import { z } from "zod";
import { timerExpiryBehaviors, type Settings, type SettingsKey } from "@/lib/settings/schema";
import { checkbox, intString, optionalIntString } from "./admin";

// Form fields (strings) -> typed settings values. The stored value is validated
// again by the settings schema in saveSetting().

const text = (max: number) => z.string().trim().max(max).default("");

export const settingsFormSchemas = {
  storefront: z
    .strictObject({
      announcementText: text(200),
      promoBannerText: text(200),
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
  storefront: [
    "announcementText",
    "promoBannerText",
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
