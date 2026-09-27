"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { createInstallStore } from "./install-store";

const store = createInstallStore();
const InstallContext = createContext<ReturnType<typeof store.getSnapshot> | null>(null);

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return <InstallContext.Provider value={state}>{children}</InstallContext.Provider>;
}

export function useInstallApp() {
  const state = useContext(InstallContext);
  if (!state) throw new Error("useInstallApp requires InstallAppProvider");
  return { ...state, install: store.install };
}
