"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { SPRING } from "@/lib/motion";

/**
 * Every motion component in the app springs by default and honours the
 * system's Reduce Motion setting: transforms are dropped, opacity is kept, so
 * things still visibly change without travelling across the screen.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      {children}
    </MotionConfig>
  );
}
