/**
 * Message lookup with {name} interpolation and plural forms, on Intl only.
 *
 * Messages are nested JSON. A plural message is several keys sharing a base name
 * with a CLDR category suffix ("one", "other", ...): `inbox.unread_one` and
 * `inbox.unread_other`; ask for `inbox.unread` with `{ count }`.
 */
export type MessageTree = { [key: string]: string | MessageTree };

export type Params = Record<string, string | number>;

const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"] as const;

/** "a.b.c" -> value, for every string leaf. */
export function flattenMessages(tree: MessageTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flattenMessages(value, path));
  }
  return out;
}

/** The locale's messages laid over the fallback's, so a missing key shows English. */
export function mergeMessages(fallback: MessageTree, locale: MessageTree): MessageTree {
  const out: MessageTree = { ...fallback };
  for (const [key, value] of Object.entries(locale)) {
    const base = out[key];
    out[key] =
      typeof value === "object" && typeof base === "object"
        ? mergeMessages(base, value)
        : (value as string | MessageTree);
  }
  return out;
}

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type Translator = (key: string, params?: Params) => string;

export function createTranslator(messages: MessageTree, locale: string): Translator {
  const flat = flattenMessages(messages);
  let rules: Intl.PluralRules | null = null;
  try {
    rules = new Intl.PluralRules(locale);
  } catch {
    rules = null;
  }

  return (key, params) => {
    let template = flat[key];

    if (template === undefined && params && typeof params.count === "number") {
      const category = rules?.select(params.count) ?? "other";
      template = flat[`${key}_${category}`] ?? flat[`${key}_other`];
    }

    // An unknown key shows the key itself rather than crashing the page.
    return interpolate(template ?? key, params);
  };
}

export { PLURAL_CATEGORIES };
