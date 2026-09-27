"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on phones, centred dialog from small-tablet width.
 *
 * The panel is capped to the small viewport and scrolls inside itself, so a
 * long form (report reasons + textarea + buttons) never runs off the top of a
 * short phone. Background scroll is locked and focus is kept inside while open,
 * then handed back to whatever opened it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      // Only what is actually rendered: the header close button, for one, is
      // display:none on phones and would otherwise count as "first".
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  // Pinned to the small viewport (svh) rather than inset-0: on iOS the large
  // viewport extends under the browser toolbar, which put the sheet below the
  // fold. From sm up it is a centred dialog instead.
  return createPortal(
    <div className="fixed inset-x-0 top-0 z-50 flex h-svh items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-sheet relative flex max-h-[92svh] w-full flex-col rounded-t-3xl bg-raised shadow-2xl outline-none",
          "sm:max-h-[min(88svh,52rem)] sm:rounded-3xl",
          size === "lg" ? "sm:max-w-xl" : "sm:max-w-md",
        )}
      >
        <div className="shrink-0 px-5 pt-2.5 sm:px-6 sm:pt-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-start justify-between gap-3 pb-4">
            <h2 id={titleId} className="min-w-0 text-lg font-bold leading-snug text-ink [overflow-wrap:anywhere]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 hidden size-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-faint hover:bg-sunken hover:text-ink sm:flex"
            >
              ×
            </button>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
