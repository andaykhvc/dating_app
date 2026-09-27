"use client";

const MIN_AGE = 18;
const MAX_AGE = 80;

/** Two native range inputs — no dependency, and both thumbs stay reachable. */
export function AgeRangeSlider({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-ink">
          {min} – {max === MAX_AGE ? `${MAX_AGE}+` : max}
        </span>
        <span className="text-sm text-faint">years old</span>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-faint">Minimum</span>
          <input
            type="range"
            min={MIN_AGE}
            max={MAX_AGE}
            value={min}
            onChange={(e) =>
              onChange(Math.min(Number(e.target.value), max), max)
            }
            // The track stays thin; the taller box is a bigger thumb target.
            className="h-8 w-full cursor-pointer accent-[var(--brand)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-faint">Maximum</span>
          <input
            type="range"
            min={MIN_AGE}
            max={MAX_AGE}
            value={max}
            onChange={(e) =>
              onChange(min, Math.max(Number(e.target.value), min))
            }
            className="h-8 w-full cursor-pointer accent-[var(--brand)]"
          />
        </label>
      </div>
    </div>
  );
}
