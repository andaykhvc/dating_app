import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { SettingsPanel } from "@/features/profile/SettingsPanel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

type BlockedUser = {
  user_id: string;
  first_name: string | null;
  primary_photo_path: string | null;
  blocked_at: string;
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_blocked_users");

  return (
    <>
      <TopBar title="Settings" />
      <SettingsPanel blocked={(data ?? []) as BlockedUser[]} />
    </>
  );
}
