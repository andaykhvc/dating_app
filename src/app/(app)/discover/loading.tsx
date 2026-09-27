import { TopBar } from "@/components/layout/TopBar";

/** Same boxes as the real deck, so nothing jumps when it arrives. */
export default function DiscoverLoading() {
  return (
    <>
      <TopBar title="Discover" />
      <div aria-busy className="flex min-h-0 flex-1 justify-center px-gutter pb-3 pt-3 md:pb-6 md:pt-5">
        <div className="flex w-full max-w-[26rem] flex-col">
          <div className="my-auto flex min-h-0 w-full flex-1 flex-col md:max-h-[46rem]">
            <div className="skeleton min-h-0 flex-1 rounded-[var(--radius-card)]" />
            <div className="flex shrink-0 items-center justify-center gap-6 pb-1 pt-4 short:gap-5 short:pt-3">
              <div className="skeleton size-16 rounded-full short:size-14" />
              <div className="skeleton size-20 rounded-full short:size-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
