import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { InterestsStep } from "@/features/onboarding/components/InterestsStep";
import type { Interest } from "@/types/domain";

export default async function InterestsPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const [{ data: interests }, { data: mine }] = await Promise.all([
    supabase.from("interests").select("id, key, label, emoji").order("id"),
    supabase.from("user_interests").select("interest_id").eq("user_id", user!.id),
  ]);

  return (
    <InterestsStep
      interests={(interests ?? []) as Interest[]}
      initialSelected={(mine ?? []).map((r) => r.interest_id)}
    />
  );
}
