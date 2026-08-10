import { createClient } from "@/lib/supabase/server";
import { InterestsStep } from "@/features/onboarding/components/InterestsStep";
import type { Interest } from "@/types/domain";

export default async function InterestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
