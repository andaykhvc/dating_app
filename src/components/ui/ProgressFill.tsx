"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The moving part of a progress bar. It fills on a spring from wherever it
 * currently is, so earning XP twice in a row reads as one continuous gain, not
 * a bar that resets and replays. On first paint it simply grows in from zero.
 */
export function ProgressFill({
  value,
  className,
}: {
  /** 0–100. */
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <motion.div
      className={cn("h-full rounded-full", className)}
      initial={{ width: "0%" }}
      animate={{ width: `${pct}%` }}
      transition={{ type: "spring", bounce: 0.12, duration: 0.7 }}
    />
  );
}
