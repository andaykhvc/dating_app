import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { LocaleSync } from "@/features/i18n/LocaleSync";
import { getLocale } from "@/i18n/server";

/**
 * The onboarding gate lives here rather than in the proxy: this layout already
 * has to load the profile, so the check is free, whereas doing it in the proxy
 * would add a database round trip to every single request.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const locale = await getLocale();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/basics");

  // Phones: content over a bottom tab bar. Tablet and up: a side rail (a full
  // sidebar on wide screens) next to the content column.
  return (
    <div className="flex min-h-dvh">
      <LocaleSync locale={locale} />
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
