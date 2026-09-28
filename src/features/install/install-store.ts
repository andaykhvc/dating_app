export type InstallPlatform = "ios" | "android" | "desktop";
type InstallPromptEvent = Event & {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  platform: InstallPlatform;
  installed: boolean;
  canInstall: boolean;
  status: "idle" | "prompting" | "accepted" | "dismissed" | "error";
};

export const initialInstallState: InstallState = {
  platform: "desktop",
  installed: false,
  canInstall: false,
  status: "idle",
};

/** Kept at the root so an offer received on signup survives route changes. */
export function createInstallStore() {
  let state = initialInstallState;
  let prompt: InstallPromptEvent | null = null;
  const listeners = new Set<() => void>();
  let cleanup: (() => void) | undefined;

  function update(next: Partial<InstallState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  function listen() {
    const agent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(agent) ||
      (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)");
    const syncDisplayMode = () => {
      const installed = standalone.matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (installed) prompt = null;
      update({ installed: state.installed || installed, canInstall: !!prompt });
    };
    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (state.installed) return;
      prompt = event as InstallPromptEvent;
      update({ canInstall: true, status: "idle" });
    };
    const onInstalled = () => {
      prompt = null;
      update({ installed: true, canInstall: false, status: "idle" });
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("pageshow", syncDisplayMode);
    standalone.addEventListener("change", syncDisplayMode);
    update({ platform: ios ? "ios" : /Android/i.test(agent) ? "android" : "desktop" });
    syncDisplayMode();

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("pageshow", syncDisplayMode);
      standalone.removeEventListener("change", syncDisplayMode);
    };
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initialInstallState,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) cleanup = listen();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) cleanup?.();
      };
    },
    async install() {
      if (!prompt || state.installed || state.status === "prompting") return;
      const offer = prompt;
      // Each browser offer is single-use, including dismissals and failures.
      prompt = null;
      update({ canInstall: false, status: "prompting" });
      try {
        // Call synchronously from the click to retain browser user activation.
        const { outcome } = await offer.prompt();
        if (!state.installed) update({ status: outcome });
      } catch {
        if (!state.installed) update({ status: "error" });
      }
    },
  };
}
