import type { Transition } from "motion/react";

/*
 * The app's motion vocabulary, in Apple's terms. Motion's `bounce` + `duration`
 * spring maps onto Apple's damping ratio + response: bounce 0 is critically
 * damped (no overshoot), and duration is the response, not a fixed length.
 *
 * Default to no bounce. Overshoot is earned by a gesture that carried momentum
 * (a flick, a throw, a drag released), never by something that simply appeared.
 */

/** Moving or resizing something: graceful, no overshoot. */
export const SPRING: Transition = { type: "spring", bounce: 0, duration: 0.4 };

/** Small, quick UI responses: toggles, pills, a panel opening. */
export const SPRING_SNAPPY: Transition = { type: "spring", bounce: 0, duration: 0.3 };

/** After a flick or a drag release: the momentum shows as a little settle. */
export const SPRING_MOMENTUM: Transition = { type: "spring", bounce: 0.2, duration: 0.42 };

/** Sheets and drawers (Apple ships damping 0.8, response 0.3 for these). */
export const SPRING_SHEET: Transition = { type: "spring", bounce: 0.12, duration: 0.38 };

/** Celebrations only — the one place the interface is allowed to be playful. */
export const SPRING_PLAYFUL: Transition = { type: "spring", bounce: 0.38, duration: 0.6 };

/**
 * Where a flick would come to rest, using Apple's exponential-decay projection
 * (the same one scroll deceleration uses), from a velocity in px/s.
 * `rate` 0.998 feels like a normal scroll; 0.99 is snappier.
 */
export function project(velocity: number, rate = 0.998): number {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/**
 * Progressive resistance past a boundary: the further over, the less the
 * element follows the finger. A hard stop reads as frozen; this reads as
 * "responsive, but there is nothing more this way".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/**
 * A short tick on devices that have one (Android). Fired on the frame the
 * causal event happens, and reserved for commits and snaps — feedback on
 * everything trains people to ignore all of it.
 */
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw outside a user gesture; a missing tick is harmless.
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
