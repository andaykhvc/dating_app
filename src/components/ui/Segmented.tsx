"use client";

import { useId } from "react";
import { LayoutGroup, motion } from "motion/react";
import { SPRING_MOMENTUM } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * An iOS segmented control. The selected thumb is one raised object that
 * slides to the new segment, rather than one highlight vanishing and another
 * appearing. Built on real radio inputs, so keyboard and screen readers get a
 * normal radio group.
 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
  labelledBy,
  disabled,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  labelledBy: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="grid gap-0.5 rounded-[0.8rem] bg-fill p-0.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-9 cursor-pointer items-center justify-center rounded-[0.65rem] px-3 text-sm font-semibold transition-colors duration-200",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                selected ? "text-ink" : "text-muted hover:text-ink",
                disabled && "cursor-wait",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="thumb"
                  transition={SPRING_MOMENTUM}
                  aria-hidden
                  className="absolute inset-0 rounded-[0.65rem] bg-raised shadow-[0_0_0_0.5px_var(--separator),0_3px_8px_-2px_rgb(0_0_0/0.12)] dark:bg-[color-mix(in_oklab,var(--surface-raised),white_14%)]"
                />
              )}
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="relative">{option.label}</span>
            </label>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
