"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/icons";
import { TABS, isTabActive } from "@/components/layout/nav";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Tablet and desktop navigation. A compact icon rail from tablet width, which
 * opens into a labelled sidebar once the screen is wide enough that the space
 * would otherwise be empty margin. Same routes and order as the bottom bar.
 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="safe-top safe-bottom scrollbar-none sticky top-0 z-30 hidden h-dvh w-20 shrink-0 flex-col overflow-y-auto border-r border-line bg-raised/60 md:flex xl:w-64"
    >
      <Link
        href="/discover"
        className="mx-auto mb-4 mt-5 flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-brand xl:mx-4 xl:mb-6 tiny:my-2"
      >
        <LogoMark className="size-9" />
        <span className="hidden text-lg font-bold tracking-tight text-ink xl:inline">
          {APP_NAME}
        </span>
      </Link>

      <ul className="flex flex-1 flex-col gap-1 px-2 xl:px-3 tiny:gap-0.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-xs font-medium transition-colors tiny:py-2",
                  "xl:flex-row xl:gap-3.5 xl:px-3.5 xl:py-3 xl:text-[0.9375rem]",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted hover:bg-sunken hover:text-ink",
                )}
              >
                <Icon className="size-6" filled={active} />
                {/* A phone on its side has no height for labels under icons. */}
                <span className={cn("tiny:sr-only", active && "xl:font-semibold")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
