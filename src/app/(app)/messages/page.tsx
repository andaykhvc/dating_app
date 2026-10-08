import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";
import { MessagesIcon } from "@/components/icons";
import { ConversationList } from "@/features/chat/components/ConversationList";
import { SyncConversations } from "@/features/chat/ConversationsContext";
import { getActiveMatches } from "@/lib/supabase/queries";
import { PushTransition } from "@/components/motion/PushTransition";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const matches = await getActiveMatches();

  if (matches.length === 0) {
    return (
      <PushTransition>
        <div className="lg:hidden">
          <TopBar title="Messages" />
        </div>
        <div className="stagger flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
          <div className="flex size-20 items-center justify-center rounded-[1.5rem] bg-brand-soft text-3xl shadow-[var(--shadow-card)]">
            💬
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">Nothing here yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Conversations appear once you match with someone.
          </p>
          <Link
            href="/discover"
            className="press mt-6 rounded-full bg-brand px-6 py-3 text-[0.9375rem] font-semibold text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-10px_var(--brand)] hover:bg-brand-strong"
          >
            Find someone
          </Link>
        </div>
      </PushTransition>
    );
  }

  return (
    <PushTransition>
      <SyncConversations matches={matches} />
      {/* Phones and tablets: the list is this screen. */}
      <div className="lg:hidden">
        <TopBar title="Messages" />
        <PageBody width="default">
          <ConversationList matches={matches} />
        </PageBody>
      </div>

      {/* Desktop: the list lives in the sidebar, so this pane waits for a pick. */}
      <div className="stagger hidden flex-1 flex-col items-center justify-center px-8 text-center lg:flex">
        <div className="flex size-20 items-center justify-center rounded-[1.5rem] bg-brand-soft text-brand shadow-[var(--shadow-card)]">
          <MessagesIcon className="size-8" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-ink">Pick a conversation</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Every match comes with a mission — open one on the left to pick up
          where you left off.
        </p>
      </div>
    </PushTransition>
  );
}
