import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { LocationStep } from "@/features/onboarding/components/LocationStep";

export default async function LocationPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("country_code, city")
    .eq("id", user!.id)
    .single();

  return (
    <LocationStep
      initialCountry={profile?.country_code ?? ""}
      initialCity={profile?.city ?? ""}
    />
  );
}
