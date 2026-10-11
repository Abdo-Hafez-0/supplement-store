"use client";

import { useState, type ReactNode } from "react";
import { FileUploadButton } from "@/components/admin/file-upload-button";
import type { FormState } from "@/components/admin/form-state";
import { fieldError, FormMessage, SubmitButton } from "@/components/admin/form-status";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { MAX_FAQ_ITEMS, type Settings } from "@/lib/settings/schema";

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

type FaqRow = { id: number; question: string; answer: string };
let nextFaqId = 0;

export function HomeContentForm({ value, action }: { value: Settings["home"]; action: Action }) {
  const [faq, setFaq] = useState<FaqRow[]>(() => value.faq.map((item) => ({ id: nextFaqId++, ...item })));
  const update = (id: number, patch: Partial<FaqRow>) =>
    setFaq((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const move = (index: number, by: number) =>
    setFaq((rows) => {
      const next = [...rows];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row);
      return next;
    });

  return (
    <SettingsForm action={action}>
      {(state) => (
        <>
          <input
            type="hidden"
            name="faq"
            value={JSON.stringify(faq.map(({ question, answer }) => ({ question, answer })))}
          />
          <Field label="Headline" htmlFor="heroTitle" error={fieldError(state, "heroTitle")}>
            <Input id="heroTitle" name="heroTitle" maxLength={120} defaultValue={value.heroTitle} />
          </Field>
          <Field label="Intro text" htmlFor="heroText" error={fieldError(state, "heroText")}>
            <Textarea id="heroText" name="heroText" maxLength={400} rows={2} defaultValue={value.heroText} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="About title" htmlFor="aboutTitle" error={fieldError(state, "aboutTitle")}>
              <Input id="aboutTitle" name="aboutTitle" maxLength={120} defaultValue={value.aboutTitle} />
            </Field>
            <Field
              label="About text"
              htmlFor="aboutText"
              hint="Empty hides the section. Blank lines start a new paragraph."
              error={fieldError(state, "aboutText")}
              className="md:col-span-2"
            >
              <Textarea id="aboutText" name="aboutText" maxLength={3000} rows={5} defaultValue={value.aboutText} />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">
              FAQ ({faq.length}/{MAX_FAQ_ITEMS})
            </legend>
            {faq.map((row, index) => (
              <div key={row.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Input
                  aria-label={`Question ${index + 1}`}
                  placeholder="Question"
                  maxLength={200}
                  required
                  value={row.question}
                  onChange={(event) => update(row.id, { question: event.currentTarget.value })}
                />
                <Textarea
                  aria-label={`Answer ${index + 1}`}
                  placeholder="Answer"
                  maxLength={2000}
                  rows={3}
                  required
                  value={row.answer}
                  onChange={(event) => update(row.id, { answer: event.currentTarget.value })}
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)}>
                    Move up
                  </Button>
                  <Button size="sm" variant="ghost" disabled={index === faq.length - 1} onClick={() => move(index, 1)}>
                    Move down
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setFaq((rows) => rows.filter((r) => r.id !== row.id))}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button
                size="sm"
                variant="secondary"
                disabled={faq.length >= MAX_FAQ_ITEMS}
                onClick={() => setFaq((rows) => [...rows, { id: nextFaqId++, question: "", answer: "" }])}
              >
                Add question
              </Button>
            </div>
            {fieldError(state, "faq") && <p className="text-xs text-danger">{fieldError(state, "faq")}</p>}
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Footer contacts (empty fields are hidden)</legend>
            <Field label="Email" htmlFor="contactEmail" error={fieldError(state, "contactEmail")}>
              <Input id="contactEmail" name="contactEmail" type="email" maxLength={254} defaultValue={value.contactEmail} />
            </Field>
            <Field label="Phone" htmlFor="contactPhone" error={fieldError(state, "contactPhone")}>
              <Input id="contactPhone" name="contactPhone" maxLength={40} defaultValue={value.contactPhone} />
            </Field>
            <Field label="Address" htmlFor="contactAddress" error={fieldError(state, "contactAddress")}>
              <Input id="contactAddress" name="contactAddress" maxLength={300} defaultValue={value.contactAddress} />
            </Field>
            <Field label="Support hours" htmlFor="contactHours" error={fieldError(state, "contactHours")}>
              <Input
                id="contactHours"
                name="contactHours"
                maxLength={120}
                defaultValue={value.contactHours}
                placeholder="Mon-Fri, 9am-5pm ET"
              />
            </Field>
          </fieldset>
        </>
      )}
    </SettingsForm>
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
