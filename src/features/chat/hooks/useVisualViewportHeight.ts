"use client";

import { useEffect, type RefObject } from "react";

/**
 * Sizes a full-screen element to the part of the screen the user can see.
 *
 * Android Chrome already shrinks `dvh` when the keyboard opens (the root
 * viewport sets interactive-widget=resizes-content). iOS Safari does not: it
 * slides the whole page up instead, which pushes the chat header off the top.
 * Tracking the visual viewport and writing its height to `--vvh` keeps the
 * header, messages and composer all on screen with the keyboard open.
 */
export function useVisualViewportHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const vv = window.visualViewport;
    const el = ref.current;
    if (!vv || !el) return;

    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Pinch-zoom also shrinks the visual viewport; only follow the keyboard.
        if (Math.abs(vv.scale - 1) > 0.01) {
          el.style.removeProperty("--vvh");
          return;
        }
        el.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
        // Undo iOS panning the page to reveal the focused field — the element
        // now fits the visible area, so there is nothing to pan to.
        if (vv.offsetTop > 0) window.scrollTo(0, 0);
      });
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      el.style.removeProperty("--vvh");
    };
  }, [ref]);
}
