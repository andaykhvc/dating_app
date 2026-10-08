import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getMessages, type MessageKey } from "./messages";
import { createTranslator, type Params } from "./translate";

/**
 * The locale for this request. Cookie first (free); only a browser with no
 * cookie yet (a new device after sign-in) costs one small profile read.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const cookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = headerList.get("accept-language");

  let profile: string | null = null;
  if (!cookie) {
    const user = await getCurrentUser();
    if (user) {
      const supabase = await createClient();
      const { data } = await supabase.from("profiles").select("ui_language").eq("id", user.id).single();
      profile = (data?.ui_language as string | null | undefined) ?? null;
    }
  }

  return resolveLocale({ cookie, profile, acceptLanguage });
});

/** Translator for Server Components: `const t = await getT(); t("nav.discover")`. */
export async function getT() {
  const locale = await getLocale();
  const translate = createTranslator(getMessages(locale), locale);
  return (key: MessageKey, params?: Params) => translate(key, params);
}
