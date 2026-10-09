import "server-only";
import { inArray } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { defaultSettings, settingsSchemas, type Settings, type SettingsKey } from "./schema";

export * from "./schema";

/** All settings groups, each validated, with defaults for missing or invalid rows. */
export async function getSettings(db: Db): Promise<Settings> {
  const keys = Object.keys(settingsSchemas) as SettingsKey[];
  const rows = await db.select().from(settings).where(inArray(settings.key, keys));
  const result = structuredClone(defaultSettings);
  for (const row of rows) {
    const key = row.key as SettingsKey;
    const parsed = settingsSchemas[key].safeParse(row.value);
    if (parsed.success) (result as Record<SettingsKey, unknown>)[key] = parsed.data;
  }
  return result;
}

export async function saveSetting<K extends SettingsKey>(db: Db, key: K, value: Settings[K]) {
  const data = settingsSchemas[key].parse(value);
  await db
    .insert(settings)
    .values({ key, value: data })
    .onConflictDoUpdate({ target: settings.key, set: { value: data, updatedAt: new Date() } });
}
