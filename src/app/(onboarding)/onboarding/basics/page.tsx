import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { BasicsStep } from "@/features/onboarding/components/BasicsStep";

export default async function BasicsPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, date_of_birth")
    .eq("id", user!.id)
    .single();

  return (
    <BasicsStep
      initialFirstName={profile?.first_name ?? ""}
      initialDob={profile?.date_of_birth ?? ""}
    />
  );
}
