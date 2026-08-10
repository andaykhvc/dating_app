import type { ReactNode } from "react";

export function TopBar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-faint">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
