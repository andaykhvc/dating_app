"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import type { MessageKey } from "./messages";
import { createTranslator, type MessageTree, type Params } from "./translate";

type Value = { locale: Locale; messages: MessageTree };

const I18nContext = createContext<Value | null>(null);

/** Gets the locale's messages (English filling gaps) from the server layout. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: MessageTree;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): Value {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useT / useLocale must be used inside <I18nProvider>.");
  return value;
}

/** Translator for Client Components: `const t = useT(); t("nav.discover")`. */
export function useT() {
  const { locale, messages } = useI18n();
  return useMemo(() => {
    const translate = createTranslator(messages, locale);
    return (key: MessageKey, params?: Params) => translate(key, params);
  }, [locale, messages]);
}

export function useLocale(): Locale {
  return useI18n().locale;
}
