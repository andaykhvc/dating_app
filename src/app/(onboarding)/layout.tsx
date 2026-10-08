import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { AcceptTerms } from "@/features/legal/AcceptTerms";
import { pendingLegal } from "@/lib/legal-consent";

export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, terms_version, privacy_version")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) redirect("/discover");

  // OAuth signups skip the signup form's checkbox, so nobody gets past this
  // point (and into the app) without an acceptance on file.
  const legal = pendingLegal(profile);
  if (legal) {
    return (
      <main className="flex flex-1 flex-col">
        <AcceptTerms mode={legal} />
      </main>
    );
  }

  return <main className="flex flex-1 flex-col">{children}</main>;
}
