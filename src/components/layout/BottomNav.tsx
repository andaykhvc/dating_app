"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { TABS, isImmersive, isTabActive } from "@/components/layout/nav";
import { useT } from "@/i18n/client";
import { SPRING_MOMENTUM } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Phones only — from tablet width up the SideNav takes over.
 *
 * A floating glass capsule rather than an opaque strip: content scrolls on
 * underneath and stays visible through it. The selection is one physical pill
 * that springs from tab to tab, so it reads as the same object moving, not one
 * highlight switching off and another on. The wrapper is sticky and clear, so
 * it still reserves its own height and the last row of a page is reachable.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  if (isImmersive(pathname)) return null;

  return (
    <div
      className="pointer-events-none sticky bottom-0 z-30 px-3 pb-safe-2 pt-2 md:hidden tiny:px-2 tiny:pb-safe-1 tiny:pt-1"
      // Anchored through screen transitions: the content moves, the bar does not.
      style={{ viewTransitionName: "tab-bar" }}
    >
      <nav
        aria-label={t("nav.label")}
        className="material-float safe-x pointer-events-auto mx-auto max-w-md rounded-[1.75rem] p-1"
      >
        <ul className="flex items-stretch">
          {TABS.map(({ href, labelKey, Icon }) => {
            const active = isTabActive(pathname, href);
            return (
              <li key={href} className="relative flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[1.5rem] px-1 pb-1 pt-1.5 tiny:min-h-11 tiny:py-1",
                    active ? "text-brand" : "text-muted",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-selection"
                      transition={SPRING_MOMENTUM}
                      aria-hidden
                      className="absolute inset-0 rounded-[1.5rem] bg-fill"
                    />
                  )}
                  <Icon className="relative size-[1.625rem]" filled={active} />
                  <span
                    className={cn(
                      "relative text-xs leading-none tracking-[0.005em] tiny:sr-only",
                      active ? "font-semibold" : "font-medium",
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
