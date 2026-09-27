import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MatchSummary } from "@/types/domain";

/**
 * Request-scoped reads shared between a layout and the page inside it.
 *
 * A layout and its page render in the same request but know nothing about each
 * other, so without this each of them made its own auth round trip (and the
 * messages layout and page each called get_matches). `cache` collapses those
 * into one call per request; nothing is shared across requests or users.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Every match, including ended ones, so an old thread stays readable. */
export const getMatches = cache(async (): Promise<MatchSummary[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_matches");
  return (data ?? []) as MatchSummary[];
});

export async function getActiveMatches(): Promise<MatchSummary[]> {
  return (await getMatches()).filter((m) => m.status === "active");
}
