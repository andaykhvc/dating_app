import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";

export default function ProfileLoading() {
  return (
    <>
      <TopBar title="Your profile" width="wide" />
      <PageBody
        width="wide"
        className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8"
      >
        <div aria-busy className="space-y-4">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start">
            <div className="skeleton size-[76px] shrink-0 rounded-full lg:hidden" />
            <div className="flex-1 space-y-2 lg:w-full">
              <div className="skeleton h-7 w-40 rounded-full" />
              <div className="skeleton h-4 w-28 rounded-full" />
            </div>
          </div>
          <div className="skeleton hidden aspect-[4/5] rounded-[var(--radius-card)] lg:block" />
          <div className="skeleton h-12 rounded-full" />
        </div>
        <div className="space-y-4 md:space-y-5">
          <div className="skeleton h-40 rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            <div className="skeleton h-28 rounded-3xl" />
            <div className="skeleton h-28 rounded-3xl" />
          </div>
          <div className="skeleton h-32 rounded-3xl" />
        </div>
      </PageBody>
    </>
  );
}
