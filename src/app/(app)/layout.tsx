import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";

/**
 * The onboarding gate lives here rather than in the proxy: this layout already
 * has to load the profile, so the check is free, whereas doing it in the proxy
 * would add a database round trip to every single request.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/basics");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
