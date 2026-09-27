import { notFound } from "next/navigation";
import { ChatThread } from "@/features/chat/components/ChatThread";
import { SyncConversations } from "@/features/chat/ConversationsContext";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getMatches } from "@/lib/supabase/queries";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import { one } from "@/lib/utils";
import type { ChatMessage } from "@/types/domain";

const SELECT =
  "id, match_id, sender_id, body, reply_to_message_id, delivery_state, created_at, " +
  "reply_to:messages!reply_to_message_id(id, body, sender_id), " +
  "correction:message_corrections(id, message_id, corrector_id, corrected_text, note, created_at)";

function flatten(row: Record<string, unknown>): ChatMessage {
  return {
    ...(row as unknown as ChatMessage),
    reply_to: one(row.reply_to as ChatMessage["reply_to"] | ChatMessage["reply_to"][]),
    correction: one(
      row.correction as ChatMessage["correction"] | ChatMessage["correction"][],
    ),
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();

  // Independent reads, so they go out together rather than one after another.
  // RLS already limits messages to members, so fetching before the membership
  // check below leaks nothing. The user and the match list are shared with the
  // layouts above through the request cache.
  const [user, matches, { data: rows }] = await Promise.all([
    getCurrentUser(),
    getMatches(),
    supabase
      .from("messages")
      .select(SELECT)
      .eq("match_id", matchId)
      .order("id", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE),
  ]);

  const match = matches.find((m) => m.match_id === matchId);
  if (!match) notFound();

  const messages = ((rows ?? []) as unknown as Record<string, unknown>[])
    .map(flatten)
    .reverse();

  return (
    <>
      <SyncConversations matches={matches.filter((m) => m.status === "active")} />
      <ChatThread
        key={matchId}
        match={match}
        viewerId={user!.id}
        initialMessages={messages}
      />
    </>
  );
}
