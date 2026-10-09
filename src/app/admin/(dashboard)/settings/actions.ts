"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/form-state";
import { invalid } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { deleteMedia } from "@/lib/media";
import { getSettings, saveSetting, settingsSchemas, type Settings, type SettingsKey } from "@/lib/settings";
import { settingsFormFields, settingsFormSchemas } from "@/lib/validation/settings-forms";
import { pickFields } from "@/lib/validation/form";

const settingsKey = z.enum(Object.keys(settingsSchemas) as [SettingsKey, ...SettingsKey[]]);

export async function saveSettingsGroup(group: SettingsKey, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const key = settingsKey.parse(group);
  const parsed = settingsFormSchemas[key].safeParse(pickFields(formData, settingsFormFields[key]));
  if (!parsed.success) return invalid(parsed.error);

  const db = getDb();
  const previousVideo = key === "video" ? (await getSettings(db)).video.fileKey : null;
  await saveSetting(db, key, parsed.data);
  if (key === "video") {
    const current = (parsed.data as Settings["video"]).fileKey;
    if (previousVideo && previousVideo !== current) await deleteMedia([previousVideo]);
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Saved." };
}
