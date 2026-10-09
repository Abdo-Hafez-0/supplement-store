import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { getSettings } from "@/lib/settings";
import { saveSettingsGroup } from "./actions";
import { ChatForm, LimitsForm, StorefrontTextsForm, TimerForm, VideoForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings(getDb());

  return (
    <>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card title="Banners and badges">
        <StorefrontTextsForm value={settings.storefront} action={saveSettingsGroup.bind(null, "storefront")} />
      </Card>

      <Card
        title="Countdown timer"
        description="Bundle prices are only guaranteed while the visitor's timer runs. The server checks it, so it can't be reset from the browser."
      >
        <TimerForm value={settings.timer} action={saveSettingsGroup.bind(null, "timer")} />
      </Card>

      <Card title="How-to video" description="One video shared by all product pages.">
        <VideoForm value={settings.video} action={saveSettingsGroup.bind(null, "video")} />
      </Card>

      <Card title="Cart limits">
        <LimitsForm value={settings.limits} action={saveSettingsGroup.bind(null, "limits")} />
      </Card>

      <Card title="Live chat">
        <ChatForm value={settings.chat} action={saveSettingsGroup.bind(null, "chat")} />
      </Card>
    </>
  );
}
