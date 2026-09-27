import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The three content widths every screen picks from, so headers and bodies line
 * up and nothing stretches edge to edge on a wide monitor.
 *
 * - narrow: forms, settings, a single challenge — reading width
 * - default: lists and single-column feeds
 * - wide: grids and two-column desktop layouts
 */
export const PAGE_WIDTH = {
  narrow: "max-w-xl",
  default: "max-w-3xl",
  wide: "max-w-6xl",
} as const;

export type PageWidth = keyof typeof PAGE_WIDTH;

export function PageBody({
  width = "default",
  className,
  children,
}: {
  width?: PageWidth;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-gutter py-5 md:py-8",
        PAGE_WIDTH[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Small uppercase heading used above grouped content across the app. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mb-2.5 text-xs font-semibold uppercase tracking-wide text-faint",
        className,
      )}
    >
      {children}
    </h2>
  );
}
