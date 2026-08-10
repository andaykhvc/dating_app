import { createClient } from "@/lib/supabase/server";
import { PreferencesStep } from "@/features/onboarding/components/PreferencesStep";
import type { Intention } from "@/types/domain";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "intentions, preferred_age_min, preferred_age_max, preferred_countries, hide_dating_profiles",
    )
    .eq("id", user!.id)
    .single();

  return (
    <PreferencesStep
      initialIntentions={(profile?.intentions ?? []) as Intention[]}
      initialAgeMin={profile?.preferred_age_min ?? 18}
      initialAgeMax={profile?.preferred_age_max ?? 45}
      initialCountries={profile?.preferred_countries ?? []}
      initialHideDating={profile?.hide_dating_profiles ?? false}
    />
  );
}
