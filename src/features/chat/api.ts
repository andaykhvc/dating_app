import { createClient } from "@/lib/supabase/client";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import { one } from "@/lib/utils";
import type { ChatMessage, ReportReason } from "@/types/domain";

const SELECT =
  "id, match_id, sender_id, body, reply_to_message_id, delivery_state, created_at, " +
  "reply_to:messages!reply_to_message_id(id, body, sender_id), " +
  "correction:message_corrections(id, message_id, corrector_id, corrected_text, note, created_at)";

type RawMessage = Omit<ChatMessage, "correction" | "reply_to"> & {
  reply_to: ChatMessage["reply_to"] | ChatMessage["reply_to"][] | null;
  correction: ChatMessage["correction"] | ChatMessage["correction"][] | null;
};

function normalize(row: RawMessage): ChatMessage {
  return {
    ...row,
    reply_to: one(row.reply_to),
    correction: one(row.correction),
  };
}

/**
 * Keyset pagination on the bigint id — no OFFSET, so scrolling back through a
 * long conversation stays the same cost as opening it.
 */
export async function fetchMessages(
  matchId: string,
  before?: number,
): Promise<ChatMessage[]> {
  const supabase = createClient();
  let query = supabase
    .from("messages")
    .select(SELECT)
    .eq("match_id", matchId)
    .order("id", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE);

  if (before !== undefined) query = query.lt("id", before);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as RawMessage[]).map(normalize).reverse();
}

export async function fetchMessage(id: number): Promise<ChatMessage | null> {
  const supabase = createClient();
  const { data } = await supabase.from("messages").select(SELECT).eq("id", id).single();
  return data ? normalize(data as unknown as RawMessage) : null;
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  body: string,
  replyToId: number | null,
): Promise<ChatMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: senderId,
      body,
      reply_to_message_id: replyToId,
    })
    .select(SELECT)
    .single();

  if (error) throw error;
  return normalize(data as unknown as RawMessage);
}

/** The recipient acknowledges receipt. A column grant limits this to the flag. */
export async function markDelivered(messageId: number) {
  const supabase = createClient();
  await supabase
    .from("messages")
    .update({ delivery_state: "delivered" })
    .eq("id", messageId);
}

export async function submitCorrection(
  messageId: number,
  correctorId: string,
  correctedText: string,
  note: string | null,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("message_corrections")
    .insert({
      message_id: messageId,
      corrector_id: correctorId,
      corrected_text: correctedText,
      note,
    })
    .select("id, message_id, corrector_id, corrected_text, note, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function reportUser(
  reportedId: string,
  reporterId: string,
  reason: ReportReason,
  details: string,
  matchId: string,
) {
  const supabase = createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    match_id: matchId,
    reason,
    details: details.trim() || null,
  });
  if (error) throw error;
}

/** Blocking also ends the match, which is why it goes through the function. */
export async function blockUser(targetId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("block_user", { p_target_id: targetId });
  if (error) throw error;
}

export async function advanceMission(matchMissionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("advance_match_mission", {
    p_match_mission_id: matchMissionId,
  });
  if (error) throw error;
  return data as {
    steps_completed: number;
    target_steps: number;
    mission_completed: boolean;
    xp_awarded: number;
  };
}
