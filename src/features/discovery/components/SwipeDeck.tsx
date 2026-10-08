"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ProfileCard } from "@/features/discovery/components/ProfileCard";
import { LikeIcon, PassIcon } from "@/components/icons";
import type { DiscoveryCard, SwipeAction } from "@/types/domain";
import {
  SPRING_MOMENTUM,
  haptic,
  prefersReducedMotion,
  project,
  rubberband,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Fraction of the card width the projected landing point must cross. */
const THRESHOLD_RATIO = 0.32;
/** Movement before a press counts as a drag rather than a tap. */
const SLOP_PX = 4;

export type SwipeDeckHandle = { swipe: (action: SwipeAction) => void };

type Drag = {
  active: boolean;
  /** Pointer position minus the card's offset, so the grab point stays put. */
  originX: number;
  originY: number;
  startX: number;
  moved: boolean;
  crossed: boolean;
};

/**
 * The card is a physical object on springs.
 *
 * - It tracks the finger 1:1 from wherever it was grabbed, and can be caught
 *   again mid-flight: a new press starts from its live position, never a reset.
 * - It tilts around the grab point — held near the bottom, it swings the other
 *   way, like a real card would.
 * - On release the decision is made from where the flick would carry it
 *   (momentum projection), not where the finger stopped, so a short fast flick
 *   commits and a slow long drag that drifts back does not.
 * - The throw and the snap-back both inherit the finger's velocity, so there
 *   is no seam between dragging and animating.
 *
 * Drag never touches React state: motion values write straight to the DOM.
 */
export function SwipeDeck({
  cards,
  onSwipe,
  onInfo,
  busy,
  ref,
}: {
  cards: DiscoveryCard[];
  onSwipe: (card: DiscoveryCard, action: SwipeAction) => void;
  onInfo: () => void;
  busy: boolean;
  ref?: Ref<SwipeDeckHandle>;
}) {
  const [flying, setFlying] = useState<SwipeAction | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>({
    active: false, originX: 0, originY: 0, startX: 0, moved: false, crossed: false,
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  /** +1 grabbed in the top half, -1 in the bottom half. */
  const tilt = useMotionValue(1);
  /** The commit distance in px, from the card's real width. */
  const limit = useMotionValue(110);

  const rotate = useTransform(() => x.get() * 0.055 * tilt.get());
  const strength = useTransform(() => Math.min(1, Math.abs(x.get()) / limit.get()));
  // The card underneath rises to meet you as the top one leaves.
  const nextScale = useTransform(() => 0.94 + strength.get() * 0.06);
  const nextY = useTransform(() => 14 - strength.get() * 14);
  const nextOpacity = useTransform(() => 0.55 + strength.get() * 0.45);
  const likeOpacity = useTransform(() => (x.get() > 24 ? strength.get() : 0));
  const passOpacity = useTransform(() => (x.get() < -24 ? strength.get() : 0));
  // The button you are heading for grows: the gesture previews its outcome.
  const likeScale = useTransform(() => 1 + (x.get() > 0 ? strength.get() * 0.12 : 0));
  const passScale = useTransform(() => 1 + (x.get() < 0 ? strength.get() * 0.12 : 0));

  const top = cards[0];
  const next = cards[1];

  // The deck sizes the threshold, so a narrow phone and a desktop column need
  // the same proportion of travel.
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      limit.set(Math.max(80, el.offsetWidth * THRESHOLD_RATIO));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit]);

  // A new top card starts centred. Done before paint, in the same commit that
  // swaps the cards, so the outgoing card never flashes back to the middle.
  useLayoutEffect(() => {
    x.set(0);
    y.set(0);
  }, [top?.id, x, y]);

  const commit = useCallback(
    (action: SwipeAction, velocity = 0) => {
      if (!top || flying) return;
      const sign = action === "like" ? 1 : -1;
      const width = deckRef.current?.offsetWidth ?? 400;
      drag.current.active = false;
      setFlying(action);
      haptic(10);

      const done = () => {
        onSwipe(top, action);
        setFlying(null);
      };

      if (prefersReducedMotion()) {
        // No throw across the screen; a quick fade-out says the same thing.
        animate(x, sign * 40, { duration: 0.12 }).then(done);
        return;
      }

      // Off the screen, carrying at least the finger's speed — a hard flick
      // leaves faster than a button tap.
      const target = sign * (window.innerWidth / 2 + width * 1.2);
      animate(x, target, {
        type: "spring",
        bounce: 0,
        duration: 0.5,
        velocity: sign * Math.max(Math.abs(velocity), 900),
        restDelta: 20,
      }).then(done);
      animate(y, y.get() + 40, { type: "spring", bounce: 0, duration: 0.5 });
    },
    [top, flying, onSwipe, x, y],
  );

  useImperativeHandle(ref, () => ({ swipe: (action) => commit(action) }), [commit]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!top || flying || busy) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Interrupt a snap-back in flight and carry on from where it is now.
    x.stop();
    y.stop();
    const rect = e.currentTarget.getBoundingClientRect();
    tilt.set(e.clientY - rect.top > rect.height * 0.6 ? -1 : 1);
    Object.assign(drag.current, {
      active: true,
      originX: e.clientX - x.get(),
      originY: e.clientY - y.get(),
      startX: e.clientX,
      moved: false,
      crossed: false,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < SLOP_PX) return;
    d.moved = true;
    const nextX = e.clientX - d.originX;
    x.set(nextX);
    // Vertical travel is allowed but resisted: the card wants to go sideways.
    y.set(rubberband(e.clientY - d.originY, e.currentTarget.offsetHeight, 0.4));

    // One tick as you cross the line where letting go would commit.
    const crossed = Math.abs(nextX) > limit.get();
    if (crossed !== d.crossed) {
      d.crossed = crossed;
      if (crossed) haptic(6);
    }
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const velocity = x.getVelocity();
    const landing = x.get() + project(velocity, 0.99);
    const threshold = limit.get();

    if (landing > threshold && x.get() > 0) return commit("like", velocity);
    if (landing < -threshold && x.get() < 0) return commit("pass", velocity);

    // Not this time: home again, with the flick's momentum showing as a settle.
    animate(x, 0, { ...SPRING_MOMENTUM, velocity });
    animate(y, 0, { ...SPRING_MOMENTUM, velocity: y.getVelocity() });
  }

  // Top card last in the DOM so it paints above the one underneath.
  const stack = [next, top].filter(Boolean) as DiscoveryCard[];
  const disabled = !top || busy || flying !== null;

  return (
    // On a phone turned sideways the buttons move beside the card instead of
    // eating the little height there is.
    <div className="flex min-h-0 flex-1 flex-col tiny:flex-row tiny:gap-3">
      <div ref={deckRef} className="relative min-h-0 flex-1">
        {stack.map((card) => {
          const isTop = card.id === top?.id;
          return (
            <motion.div
              key={card.id}
              aria-hidden={isTop ? undefined : true}
              // A freshly dealt card fades up into place underneath.
              initial={isTop ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "absolute inset-0",
                isTop
                  ? "no-touch-scroll z-10 cursor-grab will-change-transform active:cursor-grabbing"
                  : "pointer-events-none",
              )}
            >
              <motion.div
                className="size-full origin-bottom"
                style={
                  isTop
                    ? { x, y, rotate }
                    : { scale: nextScale, y: nextY, opacity: nextOpacity }
                }
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
              >
                <ProfileCard
                  card={card}
                  eager={isTop}
                  onInfo={isTop ? onInfo : undefined}
                />

                {isTop && (
                  <>
                    <Stamp opacity={likeOpacity} tone="like" />
                    <Stamp opacity={passOpacity} tone="pass" />
                  </>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-7 pb-1 pt-4 short:gap-5 short:pt-3 tiny:flex-col-reverse tiny:gap-3 tiny:pb-0 tiny:pt-0">
        <motion.button
          type="button"
          onClick={() => commit("pass")}
          disabled={disabled}
          aria-label={top ? `Pass on ${top.first_name}` : "Pass"}
          style={{ scale: passScale }}
          className="material-float flex size-16 items-center justify-center rounded-full text-negative transition-opacity disabled:opacity-40 short:size-14"
        >
          <span className="press flex size-full items-center justify-center rounded-full">
            <PassIcon />
          </span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => commit("like")}
          disabled={disabled}
          aria-label={top ? `Like ${top.first_name}` : "Like"}
          style={{ scale: likeScale }}
          className="flex size-20 items-center justify-center rounded-full bg-brand text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_14px_30px_-12px_var(--brand)] transition-opacity disabled:opacity-40 short:size-16"
        >
          <span className="press flex size-full items-center justify-center rounded-full">
            <LikeIcon className="size-9 short:size-8" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function Stamp({
  tone,
  opacity,
}: {
  tone: "like" | "pass";
  opacity: MotionValue<number>;
}) {
  const like = tone === "like";
  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className={cn(
        "pointer-events-none absolute top-5 rounded-2xl border-[3px] px-3.5 py-1 text-xl font-black uppercase tracking-[0.08em]",
        "bg-raised/75 backdrop-blur-md",
        like
          ? "left-5 -rotate-12 border-positive text-positive"
          : "right-5 rotate-12 border-negative text-negative",
      )}
    >
      {like ? "Yes" : "Pass"}
    </motion.div>
  );
}
