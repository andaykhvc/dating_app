import { cn } from "@/lib/utils";

export function ConversationListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden className={cn("space-y-1", compact ? "px-4 py-4" : "")}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 py-3">
          <div className="skeleton size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3 rounded-full" />
            <div className="skeleton h-3 w-3/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadSkeleton() {
  const rows = ["w-2/3", "ml-auto w-1/2", "w-3/5", "ml-auto w-2/5", "w-1/2"];
  return (
    <div aria-hidden className="flex h-dvh flex-col">
      <div className="safe-top shrink-0 border-b border-line">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center gap-3 px-gutter md:min-h-16">
          <div className="skeleton size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-28 rounded-full" />
            <div className="skeleton h-3 w-44 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-3 px-gutter py-4">
        {rows.map((width, i) => (
          <div key={i} className={cn("skeleton h-12 rounded-3xl", width)} />
        ))}
      </div>
      <div className="safe-bottom shrink-0 border-t border-line">
        <div className="mx-auto max-w-3xl px-gutter py-3">
          <div className="skeleton h-11 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
