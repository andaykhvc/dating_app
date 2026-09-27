import type { ReactNode } from "react";
import { PAGE_WIDTH, type PageWidth } from "@/components/layout/Page";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  subtitle,
  action,
  leading,
  width = "default",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** A back button or similar, placed before the title. */
  leading?: ReactNode;
  width?: PageWidth;
}) {
  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-lg">
      <div
        className={cn(
          "mx-auto flex min-h-14 items-center justify-between gap-3 px-gutter py-2.5 md:min-h-16",
          PAGE_WIDTH[width],
        )}
      >
        {leading}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-ink md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-faint md:text-sm">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
