/**
 * Picks the named text fields out of a FormData. Next adds its own `$ACTION_*`
 * fields, so we read only the fields a schema expects; the schema then rejects
 * missing or malformed values. A file where text is expected is rejected.
 */
export function pickFields<const K extends string>(
  formData: FormData,
  names: readonly K[],
): Record<K, string | undefined> {
  const out = {} as Record<K, string | undefined>;
  for (const name of names) {
    const all = formData.getAll(name);
    if (all.length > 1) throw new TypeError(`Field ${name} was sent more than once`);
    const value = all[0];
    if (value !== undefined && typeof value !== "string") {
      throw new TypeError(`Field ${name} must be text`);
    }
    out[name] = value;
  }
  return out;
}
