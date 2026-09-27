"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { ProfileCard } from "@/features/discovery/components/ProfileCard";
import { LikeIcon, PassIcon } from "@/components/icons";
import type { DiscoveryCard, SwipeAction } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Fraction of the card width a drag must cross to count as a decision. */
const THRESHOLD_RATIO = 0.3;
/** A quick flick commits early, the way native card stacks behave. */
const FLICK_VELOCITY = 0.55; // px per ms
const FLICK_MIN_DISTANCE = 40;
const FLY_MS = 220;
const EASE = "cubic-bezier(0.22,1,0.36,1)";

export type SwipeDeckHandle = { swipe: (action: SwipeAction) => void };

type DragState = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  velocity: number;
  threshold: number;
  active: boolean;
};

/**
 * Pointer Events plus a CSS transform. A swipe-card library would be both a
 * dependency and a borrowed visual identity; this is the whole mechanic in a
 * couple of hundred lines and it behaves identically with a mouse or a finger.
 *
 * The drag never touches React state: pointer moves are written straight to
 * the DOM once per animation frame, so a low-end phone is not re-rendering two
 * profile cards sixty times a second while a finger is down.
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
  const topRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const likeRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({
    x: 0, y: 0, startX: 0, startY: 0, lastX: 0, lastT: 0, velocity: 0, threshold: 110, active: false,
  });
  const frame = useRef(0);
  const top = cards[0];
  const next = cards[1];

  const paint = useCallback(() => {
    frame.current = 0;
    const { x, y, threshold } = drag.current;
    const strength = Math.min(1, Math.abs(x) / threshold);
    if (topRef.current) {
      topRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${x * 0.045}deg)`;
    }
    if (nextRef.current) {
      nextRef.current.style.transform = `scale(${0.95 + strength * 0.05}) translateY(${10 - strength * 10}px)`;
      nextRef.current.style.opacity = String(0.6 + strength * 0.4);
    }
    const show = Math.abs(x) > 40 ? strength : 0;
    if (likeRef.current) likeRef.current.style.opacity = String(x > 0 ? show : 0);
    if (passRef.current) passRef.current.style.opacity = String(x < 0 ? show : 0);
  }, []);

  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const setTransition = (on: boolean) => {
    const value = on ? `transform ${FLY_MS}ms ${EASE}, opacity ${FLY_MS}ms ${EASE}` : "none";
    if (topRef.current) topRef.current.style.transition = value;
    if (nextRef.current) nextRef.current.style.transition = value;
  };

  const commit = useCallback(
    (action: SwipeAction) => {
      if (!top || flying) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      drag.current.active = false;
      drag.current.x = (action === "like" ? 1 : -1) * Math.max(window.innerWidth, 600);
      drag.current.y = reduce ? 0 : drag.current.y;
      setFlying(action);
      setTransition(true);
      schedule();

      // Let the card clear the screen, then hand it over. The next card is
      // keyed by id, so its element — and its already-loaded photo — carries
      // straight on as the new top card with no flash.
      window.setTimeout(
        () => {
          onSwipe(top, action);
          drag.current.x = 0;
          drag.current.y = 0;
          setFlying(null);
        },
        reduce ? 90 : FLY_MS,
      );
    },
    [top, flying, onSwipe, schedule],
  );

  useImperativeHandle(ref, () => ({ swipe: commit }), [commit]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!top || flying || busy) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const d = drag.current;
    Object.assign(d, {
      active: true, startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastT: e.timeStamp, velocity: 0, x: 0, y: 0,
      // Relative to the card, so a narrow phone and a desktop column need
      // the same proportion of travel. Measured once per drag, not per frame.
      threshold: Math.max(80, e.currentTarget.offsetWidth * THRESHOLD_RATIO),
    });
    setTransition(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    d.x = e.clientX - d.startX;
    d.y = (e.clientY - d.startY) * 0.35;
    schedule();
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const flick =
      Math.abs(d.velocity) > FLICK_VELOCITY &&
      Math.abs(d.x) > FLICK_MIN_DISTANCE &&
      Math.sign(d.velocity) === Math.sign(d.x);

    if (d.x > d.threshold || (flick && d.x > 0)) return commit("like");
    if (d.x < -d.threshold || (flick && d.x < 0)) return commit("pass");

    d.x = 0;
    d.y = 0;
    setTransition(true);
    schedule();
  }

  // Top card last in the DOM so it paints above the one underneath.
  const stack = [next, top].filter(Boolean) as DiscoveryCard[];
  const disabled = !top || busy || flying !== null;

  return (
    // On a phone turned sideways the buttons move beside the card instead of
    // eating the little height there is.
    <div className="flex min-h-0 flex-1 flex-col tiny:flex-row tiny:gap-3">
      <div className="relative min-h-0 flex-1">
        {stack.map((card) => {
          const isTop = card.id === top?.id;
          return (
            <div
              key={card.id}
              ref={isTop ? topRef : nextRef}
              aria-hidden={isTop ? undefined : true}
              className={cn(
                "absolute inset-0 will-change-transform",
                isTop
                  ? "no-touch-scroll cursor-grab active:cursor-grabbing"
                  : "pointer-events-none origin-bottom",
              )}
              style={
                isTop
                  ? undefined
                  : { transform: "scale(0.95) translateY(10px)", opacity: 0.6 }
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
                  <Stamp ref={likeRef} tone="like" />
                  <Stamp ref={passRef} tone="pass" />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-6 pb-1 pt-4 short:gap-5 short:pt-3 tiny:flex-col-reverse tiny:gap-3 tiny:pb-0 tiny:pt-0">
        <button
          type="button"
          onClick={() => commit("pass")}
          disabled={disabled}
          aria-label={top ? `Pass on ${top.first_name}` : "Pass"}
          className="flex size-16 items-center justify-center rounded-full border border-line bg-raised text-negative shadow-sm transition-transform hover:border-negative/40 active:scale-90 disabled:opacity-40 short:size-14"
        >
          <PassIcon />
        </button>
        <button
          type="button"
          onClick={() => commit("like")}
          disabled={disabled}
          aria-label={top ? `Like ${top.first_name}` : "Like"}
          className="flex size-20 items-center justify-center rounded-full bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform hover:bg-brand-strong active:scale-90 disabled:opacity-40 short:size-16"
        >
          <LikeIcon className="size-9 short:size-8" />
        </button>
      </div>
    </div>
  );
}

function Stamp({ tone, ref }: { tone: "like" | "pass"; ref: Ref<HTMLDivElement> }) {
  const like = tone === "like";
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-5 rounded-xl border-4 bg-raised/70 px-3 py-1 text-xl font-black uppercase tracking-wider backdrop-blur-sm",
        like
          ? "left-5 -rotate-12 border-positive text-positive"
          : "right-5 rotate-12 border-negative text-negative",
      )}
      style={{ opacity: 0 }}
    >
      {like ? "Yes" : "Pass"}
    </div>
  );
}
