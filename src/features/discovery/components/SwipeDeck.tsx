"use client";

import { useCallback, useRef, useState } from "react";
import { ProfileCard } from "@/features/discovery/components/ProfileCard";
import { LikeIcon, PassIcon } from "@/components/icons";
import type { DiscoveryCard, SwipeAction } from "@/types/domain";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 110;
const FLY_DISTANCE = 700;

type Drag = { x: number; y: number };

/**
 * Pointer Events plus a CSS transform. A swipe-card library would be both a
 * dependency and a borrowed visual identity; this is the whole mechanic in
 * about a hundred lines and it behaves identically with a mouse or a finger.
 */
export function SwipeDeck({
  cards,
  onSwipe,
  busy,
}: {
  cards: DiscoveryCard[];
  onSwipe: (card: DiscoveryCard, action: SwipeAction) => void;
  busy: boolean;
}) {
  const [drag, setDrag] = useState<Drag>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<SwipeAction | null>(null);
  const startRef = useRef<Drag | null>(null);
  const top = cards[0];
  const next = cards[1];

  const commit = useCallback(
    (action: SwipeAction) => {
      if (!top || flying) return;
      startRef.current = null;
      setDragging(false);
      setFlying(action);
      setDrag({ x: action === "like" ? FLY_DISTANCE : -FLY_DISTANCE, y: 0 });

      // Let the card clear the screen, then hand it over and reset — resetting
      // here rather than in an effect keeps the next card from ever appearing
      // mid-flight with the previous card's transform.
      window.setTimeout(() => {
        onSwipe(top, action);
        setDrag({ x: 0, y: 0 });
        setFlying(null);
      }, 220);
    },
    [top, flying, onSwipe],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (!top || flying || busy) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const start = startRef.current;
    if (!start || flying) return;
    setDrag({
      x: e.clientX - start.x,
      y: (e.clientY - start.y) * 0.35,
    });
  }

  function onPointerUp() {
    if (!startRef.current || flying) return;
    startRef.current = null;
    setDragging(false);
    if (drag.x > SWIPE_THRESHOLD) commit("like");
    else if (drag.x < -SWIPE_THRESHOLD) commit("pass");
    else setDrag({ x: 0, y: 0 });
  }

  const intent = drag.x > 40 ? "like" : drag.x < -40 ? "pass" : null;
  const strength = Math.min(1, Math.abs(drag.x) / SWIPE_THRESHOLD);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        {next && (
          <div
            className="absolute inset-0 origin-bottom"
            style={{
              transform: `scale(${0.94 + strength * 0.05}) translateY(${10 - strength * 10}px)`,
              opacity: 0.6 + strength * 0.4,
            }}
            aria-hidden
          >
            <ProfileCard card={next} />
          </div>
        )}

        {top && (
          <div
            className="no-touch-scroll absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.045}deg)`,
              transition: dragging ? "none" : "transform 0.24s cubic-bezier(0.22,1,0.36,1)",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <ProfileCard card={top} eager />

            <div
              className={cn(
                "pointer-events-none absolute left-5 top-5 rounded-xl border-4 px-3 py-1 text-xl font-black uppercase tracking-wider",
                intent === "like"
                  ? "border-positive text-positive"
                  : "border-negative text-negative",
              )}
              style={{
                opacity: intent ? strength : 0,
                transform: `rotate(${intent === "like" ? -12 : 12}deg)`,
              }}
              aria-hidden
            >
              {intent === "like" ? "Yes" : "Pass"}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-6 pb-2 pt-5">
        <button
          type="button"
          onClick={() => commit("pass")}
          disabled={!top || busy || flying !== null}
          aria-label={top ? `Pass on ${top.first_name}` : "Pass"}
          className="flex size-16 items-center justify-center rounded-full border border-line bg-raised text-negative shadow-sm transition-transform active:scale-95 disabled:opacity-40"
        >
          <PassIcon />
        </button>
        <button
          type="button"
          onClick={() => commit("like")}
          disabled={!top || busy || flying !== null}
          aria-label={top ? `Like ${top.first_name}` : "Like"}
          className="flex size-20 items-center justify-center rounded-full bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform active:scale-95 disabled:opacity-40"
        >
          <LikeIcon className="size-9" />
        </button>
      </div>
    </div>
  );
}
