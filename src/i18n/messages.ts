import en from "./messages/en.json";
import tr from "./messages/tr.json";
import type { Locale } from "./config";
import { mergeMessages, type MessageTree } from "./translate";

/** English is the source of truth: every key in the app comes from en.json. */
const SOURCES: Record<Locale, MessageTree> = { en, tr };

type Flatten<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Flatten<T[K], `${P}${K}.`>;
}[keyof T & string];

type PluralSuffix = "_zero" | "_one" | "_two" | "_few" | "_many" | "_other";
type WithoutPluralSuffix<K extends string> = K extends `${infer Base}${PluralSuffix}` ? Base : K;

/** Every valid message key, derived from en.json: a wrong key is a compile error. */
export type MessageKey = WithoutPluralSuffix<Flatten<typeof en>>;

/** The locale's messages with English filling any gaps. */
export function getMessages(locale: Locale): MessageTree {
  return locale === "en" ? SOURCES.en : mergeMessages(SOURCES.en, SOURCES[locale]);
}
