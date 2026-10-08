"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { CloseIcon } from "@/components/icons";
import { useHydrated } from "@/components/ui/LocalTime";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SPRING_MOMENTUM, SPRING_SHEET, SPRING_SNAPPY, haptic, project } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on phones, centred dialog from small-tablet width.
 *
 * On a phone it behaves like an iOS sheet: it springs up from the bottom edge
 * and back down the same path, and the grabber/header can be dragged. Release
 * is decided by where the flick would carry it (momentum projection), not by
 * where the finger happened to stop, and the spring back inherits the finger's
 * velocity so there is no seam between dragging and animating. Pulling up past
 * the top rubber-bands instead of stopping dead.
 *
 * The panel is capped to the small viewport and scrolls inside itself, so a
 * long form never runs off the top of a short phone. Background scroll is
 * locked and focus is kept inside while open, then handed back to the opener.
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
  const hydrated = useHydrated();
  const dialog = useMediaQuery("(min-width: 40rem)");
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  // The scrim thins out as the sheet is pulled away, so the gesture previews
  // its own outcome.
  const scrimOpacity = useTransform(y, [0, 400], [1, 0.25]);

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
      // Only what is actually rendered counts as first and last.
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

  function onDragEnd(_: PointerEvent, info: PanInfo) {
    const height = panelRef.current?.offsetHeight ?? 600;
    const resting = y.get() + project(info.velocity.y);
    if (resting > height * 0.45 || info.velocity.y > 900) {
      haptic();
      onClose();
      return;
    }
    // Not far enough: back to the top, carrying the finger's velocity.
    animate(y, 0, { ...SPRING_MOMENTUM, velocity: info.velocity.y });
  }

  if (!hydrated) return null;

  // Pinned to the small viewport (svh) rather than inset-0: on iOS the large
  // viewport extends under the browser toolbar, which put the sheet below the
  // fold. From sm up it is a centred dialog instead.
  return createPortal(
    <AnimatePresence onExitComplete={() => y.set(0)}>
      {open && (
        <div
          key="sheet"
          className="fixed inset-x-0 top-0 z-50 flex h-svh items-end justify-center sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="absolute inset-0"
          >
            <motion.button
              type="button"
              aria-label="Close"
              tabIndex={-1}
              onClick={onClose}
              style={dialog ? undefined : { opacity: scrimOpacity }}
              className="size-full cursor-default bg-black/40 backdrop-blur-[3px]"
            />
          </motion.div>
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={dialog ? { opacity: 0, scale: 0.95, y: 10 } : { y: "100%" }}
            animate={dialog ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={dialog ? { opacity: 0, scale: 0.97, y: 6 } : { y: "100%" }}
            transition={dialog ? SPRING_SNAPPY : SPRING_SHEET}
            drag={dialog ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            style={dialog ? undefined : { y }}
            className={cn(
              "relative flex max-h-[92svh] w-full flex-col rounded-t-[1.75rem] bg-raised shadow-[0_-10px_40px_-12px_rgb(0_0_0/0.3)] outline-none",
              "sm:max-h-[min(88svh,52rem)] sm:rounded-[1.75rem] sm:shadow-[var(--shadow-float)]",
              size === "lg" ? "sm:max-w-xl" : "sm:max-w-md",
            )}
          >
            {/* The grab area: the grabber and the title row. Content below
                keeps its own scrolling. */}
            <div
              onPointerDown={(e) => {
                if (!dialog) dragControls.start(e);
              }}
              className="shrink-0 touch-none px-5 pt-2 sm:touch-auto sm:px-6 sm:pt-5"
            >
              <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-fill-strong sm:hidden" />
              <div className="flex items-start justify-between gap-3 pb-4">
                <h2
                  id={titleId}
                  className="min-w-0 pt-1 text-lg font-bold leading-snug text-ink [overflow-wrap:anywhere]"
                >
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
                  className="press -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
                >
                  <span className="flex size-[1.875rem] items-center justify-center rounded-full bg-fill">
                    <CloseIcon className="size-4" />
                  </span>
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
