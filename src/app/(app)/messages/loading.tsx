import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";
import { ConversationListSkeleton } from "@/features/chat/components/ChatSkeletons";

export default function MessagesLoading() {
  // On desktop the sidebar already shows the list; this pane stays quiet.
  return (
    <div aria-busy className="lg:hidden">
      <TopBar title="Messages" />
      <PageBody>
        <ConversationListSkeleton />
      </PageBody>
    </div>
  );
}
