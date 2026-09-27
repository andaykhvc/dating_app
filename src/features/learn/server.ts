import "server-only";
import type { createClient } from "@/lib/supabase/server";

/** Must match the window in learn_on_message_sent() (99993). */
const SHARE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * A phrase shared from a lesson ("Ask a match"), for prefilling the chat
 * composer. RLS limits phrase_shares to the sharer's own rows; the share must
 * also belong to this match, be unused, and still be inside the window in
 * which sending it earns XP — so the "+10 XP" note is never a false promise.
 */
export async function loadSharedPhrase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shareId: string,
  matchId: string,
): Promise<{ text: string; languageCode: string } | null> {
  const { data } = await supabase
    .from("phrase_shares")
    .select("text, match_id, used_at, language_code, created_at")
    .eq("id", shareId)
    .maybeSingle();

  if (
    !data ||
    data.match_id !== matchId ||
    data.used_at ||
    Date.parse(data.created_at) < Date.now() - SHARE_TTL_MS
  ) {
    return null;
  }
  return { text: data.text, languageCode: data.language_code };
}
