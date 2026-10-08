import { Suspense } from "react";
import { ConversationsProvider } from "@/features/chat/ConversationsContext";
import { ConversationList } from "@/features/chat/components/ConversationList";
import { ConversationListSkeleton } from "@/features/chat/components/ChatSkeletons";
import { getActiveMatches } from "@/lib/supabase/queries";

/**
 * Phones and tablets: the list and a thread are separate screens, as before.
 * From laptop width the list stays docked on the left and the thread opens
 * beside it, so moving between conversations does not bounce through a list.
 *
 * The layout itself does not wait on data — the sidebar streams in behind its
 * own Suspense boundary — and get_matches is shared with the page underneath
 * through a request-scoped cache, so the split view costs no extra query.
 * Layouts are not re-rendered between threads; the pages keep the sidebar
 * current through ConversationsProvider instead.
 */
export default function MessagesLayout({ children }: LayoutProps<"/messages">) {
  return (
    <ConversationsProvider>
      <div className="flex flex-1 lg:h-dvh lg:overflow-hidden">
        <aside className="safe-top hidden w-[21rem] shrink-0 flex-col shadow-[0.5px_0_0_var(--separator)] lg:flex xl:w-[23rem]">
          <div className="flex min-h-16 shrink-0 items-center px-5">
            <h2 className="text-[1.75rem] font-bold text-ink">Messages</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Suspense fallback={<ConversationListSkeleton compact />}>
              <SidebarConversations />
            </Suspense>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ConversationsProvider>
  );
}

async function SidebarConversations() {
  return <ConversationList matches={await getActiveMatches()} compact />;
}
