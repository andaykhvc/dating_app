"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  getServerThemePreference,
  readThemePreference,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AppearanceSettings() {
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    getServerThemePreference,
  );

  return (
    <section className="rounded-3xl border border-line bg-raised p-5">
      <h2
        id="appearance-heading"
        className="text-xs font-semibold uppercase tracking-wide text-faint"
      >
        Appearance
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="appearance-heading"
        className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-sunken p-1"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === preference;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                selected
                  ? "bg-raised text-ink shadow-sm"
                  : "text-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="appearance"
                value={option.value}
                checked={selected}
                onChange={() => setThemePreference(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        System follows your device. Light and Dark stay as you set them on this
        device.
      </p>
    </section>
  );
}
