import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { BackIcon } from "@/components/icons";
import { SettingsPanel } from "@/features/profile/SettingsPanel";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Settings" };

type BlockedUser = {
  user_id: string;
  first_name: string | null;
  primary_photo_path: string | null;
  blocked_at: string;
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data }, t] = await Promise.all([supabase.rpc("get_blocked_users"), getT()]);

  return (
    <>
      <TopBar
        title={t("settings.title")}
        width="narrow"
        leading={
          <Link
            href="/profile"
            aria-label={t("settings.backToProfile")}
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken"
          >
            <BackIcon className="size-5" />
          </Link>
        }
      />
      <SettingsPanel blocked={(data ?? []) as BlockedUser[]} />
    </>
  );
}
