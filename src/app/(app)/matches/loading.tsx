import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";

export default function MatchesLoading() {
  return (
    <>
      <TopBar title="Matches" width="wide" />
      <PageBody width="wide">
        <div
          aria-busy
          className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))] md:gap-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-line bg-raised p-4 md:p-5">
              <div className="flex items-center gap-3.5">
                <div className="skeleton size-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2 rounded-full" />
                  <div className="skeleton h-3 w-2/3 rounded-full" />
                </div>
              </div>
              <div className="skeleton mt-3.5 h-16 rounded-2xl" />
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
