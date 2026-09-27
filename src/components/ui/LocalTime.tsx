"use client";

import { useSyncExternalStore } from "react";
import {
  formatDayDivider,
  formatMessageTime,
  formatRelativeDay,
} from "@/lib/date";

const FORMATS = {
  time: formatMessageTime,
  relative: formatRelativeDay,
  day: formatDayDivider,
};

const subscribe = () => () => {};

/** False during SSR and hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * A timestamp in the viewer's own timezone and locale.
 *
 * The server formats in its own timezone (UTC on Vercel) and locale, so
 * rendering the value during SSR made every timestamp a hydration mismatch and
 * React re-rendered the whole thread on the client. Nothing about the viewer's
 * clock is knowable on the server, so this renders a same-height placeholder
 * there and fills in the real value right after hydration.
 */
export function LocalTime({
  iso,
  format,
  className,
}: {
  iso: string;
  format: keyof typeof FORMATS;
  className?: string;
}) {
  const hydrated = useHydrated();

  return (
    <time dateTime={iso} className={className}>
      {hydrated ? FORMATS[format](iso) : " "}
    </time>
  );
}
