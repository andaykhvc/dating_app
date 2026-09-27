"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, isImmersive, isTabActive } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

/** Phones only — from tablet width up the SideNav takes over. */
export function BottomNav() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="safe-bottom safe-x sticky bottom-0 z-30 border-t border-line bg-raised/95 backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-14 flex-col items-center justify-center gap-0.5 pb-1.5 pt-2 transition-colors tiny:min-h-12 tiny:pb-1 tiny:pt-1.5",
                  active ? "text-brand" : "text-faint active:text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-brand-soft",
                  )}
                >
                  <Icon className="size-6" filled={active} />
                </span>
                <span className="text-[0.6875rem] font-medium leading-none tiny:sr-only">
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
