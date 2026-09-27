import { createClient } from "@/lib/supabase/client";
import { DISCOVERY_BATCH_SIZE } from "@/lib/constants";
import type {
  DiscoveryCard,
  ProfileCard,
  SwipeAction,
  SwipeResult,
} from "@/types/domain";

export async function fetchDiscoveryBatch(
  limit = DISCOVERY_BATCH_SIZE,
): Promise<DiscoveryCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("discover_profiles", {
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as DiscoveryCard[];
}

/**
 * One call does everything: records the swipe, checks for a reverse like,
 * creates the match if there is one, and attaches its first mission.
 */
export async function recordSwipe(
  swipeeId: string,
  action: SwipeAction,
): Promise<SwipeResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_swipe", {
    p_swipee_id: swipeeId,
    p_action: action,
  });
  if (error) throw error;
  return data as SwipeResult;
}

/**
 * The full card — every interest and the whole photo gallery. Only fetched
 * when someone opens a person's details, never per card in the deck.
 */
export async function fetchProfileCard(userId: string): Promise<ProfileCard | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_profile_card", {
    p_user_id: userId,
  });
  if (error) throw error;
  return (data ?? null) as ProfileCard | null;
}
