import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { LanguagesStep } from "@/features/onboarding/components/LanguagesStep";
import type { CefrLevel, Language } from "@/types/domain";

export default async function LanguagesPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const [{ data: languages }, { data: userLanguages }] = await Promise.all([
    supabase
      .from("languages")
      .select("code, name, native_name, flag_emoji, is_launch_language")
      .order("is_launch_language", { ascending: false })
      .order("name"),
    supabase
      .from("user_languages")
      .select("language_code, role, cefr_level")
      .eq("user_id", user!.id),
  ]);

  const native = userLanguages?.find((l) => l.role === "native");
  const learning = userLanguages?.find((l) => l.role === "learning");

  return (
    <LanguagesStep
      languages={(languages ?? []) as Language[]}
      initialNative={native?.language_code ?? ""}
      initialLearning={learning?.language_code ?? ""}
      initialLevel={(learning?.cefr_level as CefrLevel) ?? "A1"}
    />
  );
}
