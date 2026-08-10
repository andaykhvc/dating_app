import { createClient } from "@/lib/supabase/server";
import { BasicsStep } from "@/features/onboarding/components/BasicsStep";

export default async function BasicsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
