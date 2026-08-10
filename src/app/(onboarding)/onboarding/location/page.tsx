import { createClient } from "@/lib/supabase/server";
import { LocationStep } from "@/features/onboarding/components/LocationStep";

export default async function LocationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
