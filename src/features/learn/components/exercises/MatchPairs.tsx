"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Instruction, type ExerciseProps } from "./shared";

/** Four tints so each pairing is visibly "these two belong together". */
const PAIR_TINTS = [
  "border-brand bg-brand-soft text-brand",
  "border-accent bg-accent-soft text-accent",
  "border-[#0e7c86] bg-[#e1f4f5] text-[#0e7c86] dark:border-[#4fd1db] dark:bg-[#10292b] dark:text-[#4fd1db]",
  "border-[#9b3bb0] bg-[#f6e8fa] text-[#9b3bb0] dark:border-[#d88ae9] dark:bg-[#2a1830] dark:text-[#d88ae9]",
];

const CELL =
  "flex min-h-14 w-full items-center rounded-2xl border-2 px-3.5 py-2.5 text-left text-[0.9375rem] font-medium leading-snug [overflow-wrap:anywhere] transition-[transform,background-color,border-color] active:scale-[0.98]";

/**
 * Pair every word with its meaning, then check once. The right answers are
 * not in the browser, so there is no tile-by-tile feedback; the result shows
 * which pairs were right.
 */
export function MatchPairs({ exercise, result, onChange, target, known, speech }: ExerciseProps) {
  const left = exercise.payload.left ?? [];
  const right = exercise.payload.right ?? [];
  const [active, setActive] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const expected = result?.expected?.pairs;

  const order = Object.keys(pairs);
  const tintOf = (leftId: string) => PAIR_TINTS[order.indexOf(leftId) % PAIR_TINTS.length];
  const leftOf = (rightId: string) => order.find((l) => pairs[l] === rightId);

  function commit(next: Record<string, string>) {
    setPairs(next);
    onChange(Object.keys(next).length === left.length ? { pairs: next } : null);
  }

  function tapLeft(id: string, text: string) {
    if (result) return;
    speech.speak(text);
    if (pairs[id]) {
      const next = { ...pairs };
      delete next[id];
      commit(next);
      setActive(id);
      return;
    }
    setActive(active === id ? null : id);
  }

  function tapRight(id: string) {
    if (result || !active) return;
    const next = { ...pairs };
    const previous = leftOf(id);
    if (previous) delete next[previous];
    next[active] = id;
    commit(next);
    setActive(null);
  }

  function cellClass(side: "left" | "right", id: string) {
    const leftId = side === "left" ? id : leftOf(id);
    if (result && leftId && expected) {
      return pairs[leftId] === expected[leftId]
        ? "border-positive bg-positive-soft text-positive"
        : "border-negative bg-negative-soft text-negative";
    }
    if (leftId && pairs[leftId]) return tintOf(leftId);
    if (side === "left" && active === id) return "border-brand bg-raised text-brand ring-4 ring-brand/15";
    return "border-line bg-raised text-ink hover:border-brand/40";
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Instruction>Match the pairs</Instruction>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="space-y-2.5" lang={target.code}>
          {left.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={active === item.id}
              disabled={result !== null}
              onClick={() => tapLeft(item.id, item.text)}
              className={cn(CELL, cellClass("left", item.id))}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="space-y-2.5" lang={known.code}>
          {right.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={result !== null || (!active && !leftOf(item.id))}
              onClick={() => tapRight(item.id)}
              className={cn(CELL, cellClass("right", item.id), !active && !leftOf(item.id) && !result && "cursor-default")}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
      {!result && (
        <p className="text-center text-xs text-faint">
          Tap a {target.name} word, then its meaning. Tap a pair again to undo it.
        </p>
      )}
    </div>
  );
}
