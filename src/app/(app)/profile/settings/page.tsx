import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { BackIcon } from "@/components/icons";
import { SettingsPanel } from "@/features/profile/SettingsPanel";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { BACK, PushTransition } from "@/components/motion/PushTransition";

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
    <PushTransition>
      <TopBar
        title={t("settings.title")}
        width="narrow"
        leading={
          <Link
            href="/profile"
            {...BACK}
            aria-label={t("settings.backToProfile")}
            className="press -ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-brand hover:bg-fill"
          >
            <BackIcon className="size-5" />
          </Link>
        }
      />
      <SettingsPanel blocked={(data ?? []) as BlockedUser[]} />
    </PushTransition>
  );
}
