export default function GameSessionLoading() {
  return (
    <div aria-busy className="flex min-h-dvh flex-col">
      <div className="safe-top shadow-[0_0.5px_0_var(--separator)]">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-gutter md:min-h-16">
          <div className="skeleton size-8 rounded-full" />
          <div className="skeleton h-4 w-40 rounded-full" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-gutter pt-6 md:gap-8 md:pt-12">
        <div className="skeleton mx-auto h-4 w-48 rounded-full" />
        <div className="skeleton mx-auto h-16 w-full max-w-md rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
