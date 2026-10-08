import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps a screen's content so navigating deeper (links tagged `nav-forward`)
 * slides it in from the trailing edge and going back (`nav-back`) reverses the
 * path. Untagged navigations — tab switches, the browser's back button,
 * refreshes — swap instantly, as switching tabs does on iOS.
 *
 * It belongs in each page, not a layout: layouts persist across navigations,
 * so they never enter or exit. The CSS lives in globals.css.
 */
export function PushTransition({
  children,
  className = "flex flex-1 flex-col",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      {/* A solid backdrop, so the snapshot of one screen never shows through the other. */}
      <div className={`${className} bg-surface`}>{children}</div>
    </ViewTransition>
  );
}

/** Link props for going one level deeper / back up, for <Link {...FORWARD}>. */
export const FORWARD = { transitionTypes: ["nav-forward"] };
export const BACK = { transitionTypes: ["nav-back"] };
