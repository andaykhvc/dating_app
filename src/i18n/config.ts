/**
 * The interface languages. To add one: add its code here and a messages file;
 * see docs/i18n.md.
 */
export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Each language in its own language, for the selector. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

export const LOCALE_COOKIE = "lm_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Language codes from an Accept-Language header, best first ("tr-TR,tr;q=0.9" -> ["tr", ...]). */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { code: tag.trim().toLowerCase().split("-")[0], quality, index };
    })
    .filter((l) => l.code && l.code !== "*" && Number.isFinite(l.quality) && l.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map((l) => l.code);
}

/**
 * The interface language: the person's saved choice (cookie, or the account's
 * setting on a browser that has no cookie yet), then what the browser asks for,
 * then English.
 */
export function resolveLocale(input: {
  cookie?: string | null;
  profile?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.cookie)) return input.cookie;
  if (isLocale(input.profile)) return input.profile;
  for (const code of parseAcceptLanguage(input.acceptLanguage)) {
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}
