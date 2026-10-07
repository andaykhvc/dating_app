import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel } from "@/types/domain";

/**
 * Both screens that edit languages and interests used to delete every row and
 * insert the new ones. Two requests, so a failed or dropped second one left the
 * person with no languages at all (the Learn tab then has nothing to teach
 * them), and several of the delete errors were never looked at.
 *
 * These write the new rows first, then remove only what is no longer wanted. A
 * failure part-way leaves the old data plus, at worst, one extra row that the
 * next save removes. Each returns an error message, or null on success.
 */

export async function saveLanguages(
  supabase: SupabaseClient,
  userId: string,
  { native, learning, level }: { native: string; learning: string; level: CefrLevel },
): Promise<string | null> {
  const table = () => supabase.from("user_languages");

  const { error: writeError } = await table().upsert(
    [
      { user_id: userId, language_code: native, role: "native", cefr_level: null },
      { user_id: userId, language_code: learning, role: "learning", cefr_level: level },
    ],
    { onConflict: "user_id,language_code,role" },
  );
  if (writeError) return writeError.message;

  for (const [role, code] of [
    ["native", native],
    ["learning", learning],
  ] as const) {
    const { error } = await table()
      .delete()
      .eq("user_id", userId)
      .eq("role", role)
      .neq("language_code", code);
    if (error) return error.message;
  }
  return null;
}

export async function saveInterests(
  supabase: SupabaseClient,
  userId: string,
  interestIds: number[],
): Promise<string | null> {
  const table = () => supabase.from("user_interests");

  if (interestIds.length > 0) {
    const { error } = await table().upsert(
      interestIds.map((id) => ({ user_id: userId, interest_id: id })),
      { onConflict: "user_id,interest_id", ignoreDuplicates: true },
    );
    if (error) return error.message;
  }

  let stale = table().delete().eq("user_id", userId);
  if (interestIds.length > 0) {
    stale = stale.not("interest_id", "in", `(${interestIds.join(",")})`);
  }
  const { error } = await stale;
  return error ? error.message : null;
}
