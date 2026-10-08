"use client";

import { useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/Segmented";
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
    <section className="surface-card p-5">
      <h2
        id="appearance-heading"
        className="text-xs font-semibold uppercase tracking-wide text-faint"
      >
        Appearance
      </h2>
      <div className="mt-3">
        <Segmented
          name="appearance"
          labelledBy="appearance-heading"
          value={preference}
          options={OPTIONS}
          onChange={setThemePreference}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        System follows your device. Light and Dark stay as you set them on this
        device.
      </p>
    </section>
  );
}
