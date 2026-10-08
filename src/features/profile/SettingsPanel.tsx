"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { DownloadMyData } from "@/features/profile/DownloadMyData";
import { AppearanceSettings } from "@/features/appearance/AppearanceSettings";
import { DeleteAccount } from "@/features/profile/DeleteAccount";
import { InstallSettings } from "@/features/install/InstallSettings";
import { AppLanguageSettings } from "@/features/i18n/AppLanguageSettings";
import { useT } from "@/i18n/client";
import { PushNotificationsCard } from "@/features/push/PushNotificationsCard";
import { LegalLinks } from "@/components/legal/LegalLinks";

type BlockedUser = {
  user_id: string;
  first_name: string | null;
  primary_photo_path: string | null;
  blocked_at: string;
};

export function SettingsPanel({ blocked }: { blocked: BlockedUser[] }) {
  const t = useT();
  const router = useRouter();
  const [list, setList] = useState(blocked);
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(userId: string) {
    setBusy(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocked_id", userId);

    if (!error) setList((prev) => prev.filter((b) => b.user_id !== userId));
    setBusy(null);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-gutter py-5 md:space-y-5 md:py-8">
      <AppLanguageSettings />
      <PushNotificationsCard />
      <AppearanceSettings />
      <InstallSettings />
      <section className="surface-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("settings.blocked.title")}
        </h2>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t("settings.blocked.empty")}
          </p>
        ) : (
          <ul className="grouped-rows -mx-5 mt-2 [--row-inset:4.25rem]">
            {list.map((person) => (
              <li
                key={person.user_id}
                className="animate-fade flex items-center gap-3 px-5 py-2.5"
              >
                <Avatar
                  storagePath={person.primary_photo_path}
                  name={person.first_name}
                  userId={person.user_id}
                  size={40}
                />
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {person.first_name ?? t("settings.blocked.someone")}
                </span>
                <button
                  type="button"
                  onClick={() => unblock(person.user_id)}
                  disabled={busy === person.user_id}
                  className="press min-h-9 shrink-0 rounded-full bg-brand-soft px-3.5 text-xs font-semibold text-brand disabled:opacity-50"
                >
                  {t("settings.blocked.unblock")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DownloadMyData />

      <section className="surface-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("settings.safety.title")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>{t("settings.safety.adults", { app: APP_NAME })}</li>
          <li>{t("settings.safety.location")}</li>
          <li>{t("settings.safety.reportBlock")}</li>
        </ul>
      </section>

      {/* One grouped list of rows, hairlines between, chevrons on the right. */}
      <nav aria-label="Help" className="surface-card grouped-rows overflow-hidden">
        {[
          { href: "/support", label: "Help & safety" },
          { href: "/guidelines", label: "Community guidelines" },
          { href: "/licenses", label: t("settings.licenses") },
        ].map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex min-h-[3.25rem] items-center justify-between px-5 text-[0.9375rem] font-medium text-ink transition-colors active:bg-fill hover:bg-fill"
          >
            {row.label}
            <Chevron />
          </Link>
        ))}
      </nav>

      <section className="surface-card p-3">
        <LegalLinks />
      </section>

      <Button variant="secondary" fullWidth onClick={signOut}>
        {t("settings.signOut")}
      </Button>

      <DeleteAccount />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 8 14" aria-hidden className="h-3.5 w-2 shrink-0 text-faint">
      <path
        d="m1.5 1.5 5 5.5-5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
