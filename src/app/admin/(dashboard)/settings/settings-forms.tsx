"use client";

import { useState, type ReactNode } from "react";
import { FileUploadButton } from "@/components/admin/file-upload-button";
import type { FormState } from "@/components/admin/form-state";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import type { Settings } from "@/lib/settings/schema";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SettingsForm({ action, children }: { action: Action; children: (state: FormState) => ReactNode }) {
  const { state, onSubmit, pending } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {children(state)}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>Save</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function StorefrontTextsForm({ value, action }: { value: Settings["storefront"]; action: Action }) {
  return (
    <SettingsForm action={action}>
      {(state) => (
        <>
          <Field label="Announcement bar" htmlFor="announcementText" hint="Thin bar at the top of every page. Empty hides it." error={fieldError(state, "announcementText")}>
            <Input id="announcementText" name="announcementText" maxLength={200} defaultValue={value.announcementText} />
          </Field>
          <Field label="Product page promo banner" htmlFor="promoBannerText" hint="Empty hides it." error={fieldError(state, "promoBannerText")}>
            <Input id="promoBannerText" name="promoBannerText" maxLength={200} defaultValue={value.promoBannerText} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Gift badge" htmlFor="giftBadgeText" hint='On tier cards with a gift, e.g. "FREE GIFT". Hidden when no gift is available.' error={fieldError(state, "giftBadgeText")}>
              <Input id="giftBadgeText" name="giftBadgeText" maxLength={40} defaultValue={value.giftBadgeText} />
            </Field>
            <Field label="Free-shipping callout" htmlFor="freeShippingText" hint="On the product page and in the cart." error={fieldError(state, "freeShippingText")}>
              <Input id="freeShippingText" name="freeShippingText" maxLength={200} defaultValue={value.freeShippingText} />
            </Field>
          </div>
          <fieldset className="grid gap-3 md:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Checkout trust badges (up to 4)</legend>
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                name={`trustBadge${index + 1}`}
                aria-label={`Trust badge ${index + 1}`}
                maxLength={60}
                placeholder={["Secure checkout", "30-day guarantee", "Made in the USA", "Fast shipping"][index]}
                defaultValue={value.trustBadges[index] ?? ""}
              />
            ))}
          </fieldset>
        </>
      )}
    </SettingsForm>
  );
}

export function TimerForm({ value, action }: { value: Settings["timer"]; action: Action }) {
  const [behavior, setBehavior] = useState(value.expiryBehavior);
  return (
    <SettingsForm action={action}>
      {(state) => (
        <>
          <Checkbox name="enabled" label="Show the countdown timer on product pages" defaultChecked={value.enabled} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Length (minutes)" htmlFor="durationMinutes" hint="Each visitor gets their own countdown." error={fieldError(state, "durationMinutes")}>
              <Input id="durationMinutes" name="durationMinutes" inputMode="numeric" required defaultValue={value.durationMinutes} />
            </Field>
            <Field label="When it reaches zero" htmlFor="expiryBehavior" error={fieldError(state, "expiryBehavior")}>
              <Select
                id="expiryBehavior"
                name="expiryBehavior"
                value={behavior}
                onChange={(event) => setBehavior(event.currentTarget.value as typeof behavior)}
              >
                <option value="regular_price_then_restart">Bundle prices end, regular price applies, then restart</option>
                <option value="restart_immediately">Restart the countdown right away (prices stay)</option>
              </Select>
            </Field>
            {behavior === "regular_price_then_restart" ? (
              <Field label="Regular price for (hours)" htmlFor="regularPriceHours" hint="Then the timer restarts for that visitor." error={fieldError(state, "regularPriceHours")}>
                <Input id="regularPriceHours" name="regularPriceHours" inputMode="numeric" required defaultValue={value.regularPriceHours} />
              </Field>
            ) : (
              <input type="hidden" name="regularPriceHours" value={value.regularPriceHours} />
            )}
          </div>
        </>
      )}
    </SettingsForm>
  );
}

export function VideoForm({ value, action }: { value: Settings["video"]; action: Action }) {
  const [fileKey, setFileKey] = useState(value.fileKey);
  return (
    <SettingsForm action={action}>
      {(state) => (
        <>
          <input type="hidden" name="fileKey" value={fileKey ?? ""} />
          {fileKey ? (
            <video src={`/media/${fileKey}`} controls preload="metadata" className="aspect-video w-full max-w-md rounded-md border border-border bg-black" />
          ) : (
            <p className="text-sm text-muted">No video yet. It shows on every product page.</p>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <FileUploadButton folder="video" label={fileKey ? "Replace video" : "Upload video"} onUploaded={(key) => setFileKey(key)} />
            {fileKey && (
              <Button size="sm" variant="danger" onClick={() => setFileKey(null)}>
                Remove video
              </Button>
            )}
          </div>
          <Field label="Section title" htmlFor="videoTitle" error={fieldError(state, "title")}>
            <Input id="videoTitle" name="title" maxLength={120} defaultValue={value.title} />
          </Field>
          {fieldError(state, "fileKey") && <p className="text-xs text-danger">{fieldError(state, "fileKey")}</p>}
          <p className="text-xs text-muted">The new video replaces the old one when you save.</p>
        </>
      )}
    </SettingsForm>
  );
}

export function ChatForm({ value, action }: { value: Settings["chat"]; action: Action }) {
  return (
    <SettingsForm action={action}>
      {(state) => (
        <Field label="Live chat ID" htmlFor="chatId" hint="From the chat provider. The chat loads on the visitor's first interaction (set up in M5)." error={fieldError(state, "chatId")}>
          <Input id="chatId" name="chatId" maxLength={100} defaultValue={value.chatId} />
        </Field>
      )}
    </SettingsForm>
  );
}

export function LimitsForm({ value, action }: { value: Settings["limits"]; action: Action }) {
  return (
    <SettingsForm action={action}>
      {(state) => (
        <Field label="Maximum quantity per product in the cart" htmlFor="maxQuantityPerLine" hint="Leave empty for no limit." error={fieldError(state, "maxQuantityPerLine")}>
          <Input id="maxQuantityPerLine" name="maxQuantityPerLine" inputMode="numeric" className="max-w-40" defaultValue={value.maxQuantityPerLine ?? ""} />
        </Field>
      )}
    </SettingsForm>
  );
}
