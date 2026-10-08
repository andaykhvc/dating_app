"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { writeLocaleCookie } from "./cookie";
import { Segmented } from "@/components/ui/Segmented";

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
    <section className="surface-card p-5">
      <h2
        id="app-language-heading"
        className="text-xs font-semibold uppercase tracking-wide text-faint"
      >
        {t("settings.appLanguage")}
      </h2>
      <div className="mt-3">
        <Segmented
          name="app-language"
          labelledBy="app-language-heading"
          value={locale}
          options={LOCALES.map((code) => ({ value: code, label: LOCALE_NAMES[code] }))}
          onChange={choose}
          disabled={saving}
        />
      </div>
      <p className="mt-3 text-xs text-muted">{t("settings.appLanguageHint")}</p>
    </section>
  );
}
