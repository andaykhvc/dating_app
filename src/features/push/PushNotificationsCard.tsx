"use client";

import { cn } from "@/lib/utils";
import { usePushNotifications } from "./usePushNotifications";

const COPY = {
  unsupported:
    "Notifications are not available in this browser. On an iPhone or iPad, add the app to your Home Screen first.",
  blocked:
    "Notifications are blocked for this site in your browser settings. Allow them there, then come back and turn this on.",
  off: "Get a heads-up when you have a new match or message. We never put message text in a notification.",
  on: "On for this device. You will be notified about new matches and messages.",
} as const;

/** Hidden unless Firebase is configured; never asks for permission until tapped. */
export function PushNotificationsCard() {
  const { state, busy, error, enable, disable } = usePushNotifications();

  if (state === "checking" || state === "unconfigured") return null;

  const canToggle = state === "off" || state === "on";
  const on = state === "on";

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="push-heading"
            className="text-xs font-semibold uppercase tracking-wide text-faint"
          >
            Notifications
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{COPY[state]}</p>
        </div>
        {canToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby="push-heading"
            disabled={busy}
            onClick={on ? disable : enable}
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              on ? "bg-brand" : "bg-line",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-1 size-6 rounded-full bg-white shadow transition-[left]",
                on ? "left-7" : "left-1",
              )}
            />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-negative">
          {error}
        </p>
      )}
    </section>
  );
}
