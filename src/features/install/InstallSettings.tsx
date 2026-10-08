"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useT } from "@/i18n/client";
import { InstallGuide } from "./InstallGuide";
import { useInstallApp } from "./InstallAppProvider";

export function InstallSettings() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { installed } = useInstallApp();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        className="flex w-full items-center gap-3 rounded-3xl border border-line bg-raised p-5 text-left transition-colors hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-brand">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand"><LogoMark className="size-6" /></span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">{installed ? t("settings.install.installed") : t("settings.install.add")}</span>
          <span className="mt-1 block text-xs text-muted">{installed ? t("settings.install.installedHint") : t("settings.install.addHint", { app: APP_NAME })}</span>
        </span>
        <span aria-hidden className="text-faint">›</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={installed ? APP_NAME : t("settings.install.sheetGet")}>
        <InstallGuide />
        <Button type="button" variant="secondary" fullWidth className="mt-5" onClick={() => setOpen(false)}>{t("settings.install.done")}</Button>
      </Sheet>
    </>
  );
}
