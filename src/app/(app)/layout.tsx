import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { TimezoneSync } from "@/features/progress/components/TimezoneSync";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { AcceptTerms } from "@/features/legal/AcceptTerms";
import { pendingLegal } from "@/lib/legal-consent";

/**
 * The onboarding gate lives here rather than in the proxy: this layout already
 * has to load the profile, so the check is free, whereas doing it in the proxy
 * would add a database round trip to every single request.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, account_status, terms_version, privacy_version")
    .eq("id", user.id)
    .single();

  // A suspended or closed account gets a plain explanation instead of the app.
  if (profile && profile.account_status !== "active") redirect("/suspended");

  if (!profile?.onboarding_completed_at) redirect("/onboarding/basics");

  // A new version of the Terms or Privacy Policy (src/lib/legal.ts) is shown
  // once, in place of the app, until it has been accepted.
  const legal = pendingLegal(profile);
  if (legal) {
    return (
      <main className="flex min-h-dvh flex-col">
        <AcceptTerms mode={legal} />
      </main>
    );
  }

  // Phones: content over a bottom tab bar. Tablet and up: a side rail (a full
  // sidebar on wide screens) next to the content column.
  return (
    <div className="flex min-h-dvh">
      <TimezoneSync />
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
