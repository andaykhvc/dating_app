import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { BioStep } from "@/features/onboarding/components/BioStep";

export default async function BioPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("bio")
    .eq("id", user!.id)
    .single();

  return <BioStep initialBio={profile?.bio ?? ""} />;
}
