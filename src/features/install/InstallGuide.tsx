"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LogoMark, CheckSmallIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useInstallApp } from "./InstallAppProvider";
import type { InstallPlatform } from "./install-store";

const platforms: { id: InstallPlatform; label: string }[] = [
  { id: "ios", label: "iPhone / iPad" },
  { id: "android", label: "Android" },
  { id: "desktop", label: "Computer" },
];

const instructions: Record<InstallPlatform, { title: string; detail: string }[]> = {
  ios: [
    { title: "Open this website in Safari", detail: "If you came from another app or browser, copy the website address and open it in Safari." },
    { title: "Tap Share", detail: "Look for the square with an upward arrow. You may need to open the More (…) menu first." },
    { title: "Choose Add to Home Screen", detail: "Scroll through the share menu. If it is missing, tap Edit Actions to add it." },
    { title: "Tap Add", detail: `Keep Open as Web App enabled if shown. The ${APP_NAME} icon will appear on your Home Screen.` },
  ],
  android: [
    { title: "Open this website in Chrome", detail: "If you are inside another app, open the website in your phone’s browser first." },
    { title: "Open the browser menu (⋮)", detail: "The menu is usually beside the address bar." },
    { title: "Tap Add to Home screen or Install app", detail: "The wording depends on your browser. Choose Install if asked." },
    { title: "Confirm the installation", detail: `Tap Install or Add, then look for ${APP_NAME} on your Home Screen or in your app drawer.` },
  ],
  desktop: [
    { title: "Open this website in Chrome or Edge", detail: "Look for the install icon beside the address bar, or the install option in the browser menu." },
    { title: "Confirm Install", detail: `${APP_NAME} will open in its own window. In Safari on Mac, use File → Add to Dock instead.` },
  ],
};

export function InstallGuide() {
  const { platform, installed, canInstall, status, install } = useInstallApp();
  const [selected, setSelected] = useState<InstallPlatform | null>(null);
  const guidePlatform = selected ?? platform;
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="text-left">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          {installed ? <CheckSmallIcon className="size-7" /> : <LogoMark className="size-7" />}
        </div>
        <div>
          <h2 id={headingId} className="text-base font-bold text-ink">
            {installed ? "Your app is ready" : "Add to Home Screen"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {installed ? `${APP_NAME} is ready on this device.` : `Keep ${APP_NAME} on your Home Screen and open it like an app.`}
          </p>
        </div>
      </div>

      {installed ? (
        <p role="status" className="mt-4 rounded-2xl bg-positive-soft p-4 text-sm text-positive">
          All set. Open the app from its icon whenever you want to practise.
        </p>
      ) : (
        <>
          {(canInstall || status === "prompting") && (
            <Button type="button" fullWidth className="mt-5" onClick={install} loading={status === "prompting"}>
              Install {APP_NAME}
            </Button>
          )}
          {status !== "idle" && status !== "prompting" && (
            <p role="status" className="mt-4 rounded-2xl bg-brand-soft p-3 text-sm text-ink">
              {status === "accepted"
                ? "Installation requested. Follow any remaining browser prompts, then look for the app icon."
                : status === "dismissed"
                  ? "No problem — you can keep using the website or follow the steps below whenever you’re ready."
                  : "The install prompt could not open. You can still use the browser menu with the steps below."}
            </p>
          )}

          <div role="group" aria-label="Installation instructions for your device" className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-sunken p-1">
            {platforms.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={guidePlatform === id} onClick={() => setSelected(id)}
                className={cn("min-h-11 rounded-xl px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand", guidePlatform === id ? "bg-raised text-brand shadow-sm" : "text-muted hover:text-ink")}>
                {label}
              </button>
            ))}
          </div>

          <ol className="mt-5 space-y-4">
            {instructions[guidePlatform].map(({ title, detail }, index) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{index + 1}</span>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-faint">
            {guidePlatform === "ios" ? "On iPhone and iPad, you add the app yourself using the Share menu. " : "If an install option is unavailable, try your regular browser outside private browsing. "}
            Free to add. An internet connection is needed to use the app.
          </p>
        </>
      )}
    </section>
  );
}
