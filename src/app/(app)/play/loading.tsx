import { TopBar } from "@/components/layout/TopBar";

export default function PlayLoading() {
  return (
    <>
      <TopBar title="Play" subtitle="Daily challenge, missions and XP" width="wide" />
      <div
        aria-busy
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-gutter py-5 md:gap-6 md:py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8"
      >
        <div className="space-y-4 md:space-y-6">
          <div className="skeleton h-28 rounded-3xl" />
          <div className="skeleton h-36 rounded-3xl" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
      </div>
    </>
  );
}
