"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { writeLocaleCookie } from "./cookie";

export function AppLanguageSettings() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function choose(next: Locale) {
    if (next === locale || saving) return;
    setSaving(true);
    // The cookie decides this browser right away; the profile column makes the
    // choice follow the account to other devices.
    writeLocaleCookie(next);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ ui_language: next }).eq("id", user.id);
    }
    router.refresh();
    setSaving(false);
  }

  return (
    <section className="rounded-3xl border border-line bg-raised p-5">
      <h2
        id="app-language-heading"
        className="text-xs font-semibold uppercase tracking-wide text-faint"
      >
        {t("settings.appLanguage")}
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="app-language-heading"
        className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-sunken p-1"
      >
        {LOCALES.map((code) => {
          const selected = code === locale;
          return (
            <label
              key={code}
              className={cn(
                "flex min-h-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                selected ? "bg-raised text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="app-language"
                value={code}
                checked={selected}
                disabled={saving}
                onChange={() => choose(code)}
                className="sr-only"
              />
              {LOCALE_NAMES[code]}
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{t("settings.appLanguageHint")}</p>
    </section>
  );
}
