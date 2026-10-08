export default function PracticeLoading() {
  return (
    <div aria-busy className="flex min-h-dvh flex-col">
      <div className="safe-top">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-2 md:min-h-16 md:px-gutter">
          <div className="skeleton size-10 rounded-full" />
          <div className="skeleton h-2 flex-1 rounded-full" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-gutter pt-6 md:pt-10">
        <div className="skeleton h-3 w-40 rounded-full" />
        <div className="skeleton h-10 w-3/4 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
