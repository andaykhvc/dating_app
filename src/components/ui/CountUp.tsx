"use client";

import { useLayoutEffect, useRef } from "react";
import { animate } from "motion/react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A number that counts up to its value once, like a score being tallied. It
 * renders the final value on the server and to screen readers, so nothing
 * depends on the animation; only the visible digits roll.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  delay = 0.15,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  // Layout effect: the digits are reset to zero before the first paint, so
  // the final number never flashes up before the count starts.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || value === 0) return;
    el.textContent = `${prefix}0${suffix}`;
    const controls = animate(0, value, {
      duration: Math.min(1.1, 0.5 + value / 400),
      delay,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => {
        el.textContent = `${prefix}${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, prefix, suffix, delay]);

  return (
    <>
      <span ref={ref} aria-hidden className="tabular-nums">
        {`${prefix}${value}${suffix}`}
      </span>
      <span className="sr-only">{`${prefix}${value}${suffix}`}</span>
    </>
  );
}
