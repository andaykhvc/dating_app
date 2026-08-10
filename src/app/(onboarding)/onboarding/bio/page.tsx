import { createClient } from "@/lib/supabase/server";
import { BioStep } from "@/features/onboarding/components/BioStep";

export default async function BioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("bio")
    .eq("id", user!.id)
    .single();

  return <BioStep initialBio={profile?.bio ?? ""} />;
}
