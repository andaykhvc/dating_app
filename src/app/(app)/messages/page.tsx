import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";
import { MessagesIcon } from "@/components/icons";
import { ConversationList } from "@/features/chat/components/ConversationList";
import { SyncConversations } from "@/features/chat/ConversationsContext";
import { getActiveMatches } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const matches = await getActiveMatches();

  if (matches.length === 0) {
    return (
      <>
        <div className="lg:hidden">
          <TopBar title="Messages" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
            💬
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">Nothing here yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Conversations appear once you match with someone.
          </p>
          <Link
            href="/discover"
            className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
          >
            Find someone
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SyncConversations matches={matches} />
      {/* Phones and tablets: the list is this screen. */}
      <div className="lg:hidden">
        <TopBar title="Messages" />
        <PageBody width="default">
          <ConversationList matches={matches} />
        </PageBody>
      </div>

      {/* Desktop: the list lives in the sidebar, so this pane waits for a pick. */}
      <div className="hidden flex-1 flex-col items-center justify-center px-8 text-center lg:flex">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <MessagesIcon className="size-8" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-ink">Pick a conversation</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Every match comes with a mission — open one on the left to pick up
          where you left off.
        </p>
      </div>
    </>
  );
}
