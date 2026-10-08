"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PAGE_WIDTH, type PageWidth } from "@/components/layout/Page";
import { cn } from "@/lib/utils";

/**
 * The navigation bar, iOS-style.
 *
 * With a large title (the default) the screen's name sits big in the content
 * and scrolls with it; once it passes under the bar, a compact title fades in
 * there instead. The bar itself is clear at rest and only becomes material —
 * translucent blur plus a hairline — when content actually scrolls beneath it,
 * so there is no permanent strip and no hard divider sitting on the page.
 *
 * `large={false}` is for screens whose content needs every pixel of height
 * (the Discover deck): the title lives in the bar from the start.
 */
export function TopBar({
  title,
  subtitle,
  action,
  leading,
  width = "default",
  large = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** A back button or similar, placed before the title. */
  leading?: ReactNode;
  width?: PageWidth;
  large?: boolean;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(!large);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setScrolled(window.scrollY > 1);
      const header = headerRef.current;
      const heading = titleRef.current;
      if (!large || !header || !heading) return;
      // Collapsed once the large title's baseline has gone under the bar.
      const barBottom = header.getBoundingClientRect().bottom;
      setCollapsed(heading.getBoundingClientRect().bottom - 6 < barBottom);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [large]);

  return (
    <>
      <header ref={headerRef} className="safe-top sticky top-0 z-20">
        {/* Scroll-edge appearance: clear at the top, material once scrolled. */}
        <div
          aria-hidden
          className={cn(
            "material absolute inset-0 shadow-[0_0.5px_0_var(--separator)] transition-opacity duration-300 ease-ios",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "relative mx-auto flex min-h-[3.25rem] items-center justify-between gap-2 px-gutter py-1.5 md:min-h-14",
            PAGE_WIDTH[width],
          )}
        >
          {leading}
          <div
            className={cn(
              "min-w-0 flex-1",
              // iOS centres the compact title between a back button and actions.
              Boolean(leading) && large && "text-center",
              Boolean(leading) && large && action == null && "pr-11",
            )}
          >
            {large ? (
              <p
                aria-hidden
                className={cn(
                  "truncate text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink transition-[opacity,transform] duration-300 ease-ios",
                  collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                {title}
              </p>
            ) : (
              <>
                <h1 className="truncate text-[1.375rem] font-bold leading-tight tracking-[-0.022em] text-ink md:text-2xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-xs text-faint md:text-sm">{subtitle}</p>
                )}
              </>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
      </header>

      {large && (
        <div
          ref={titleRef}
          className={cn("mx-auto w-full px-gutter pb-1 pt-1 md:pt-2", PAGE_WIDTH[width])}
        >
          <h1 className="text-large-title text-ink [overflow-wrap:anywhere] md:text-[2.5rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[0.9375rem] text-muted">{subtitle}</p>
          )}
        </div>
      )}
    </>
  );
}
