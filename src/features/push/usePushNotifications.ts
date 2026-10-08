"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readFirebaseConfig, serviceWorkerUrl } from "./config";

export type PushState =
  | "checking" // before the browser has been inspected
  | "unconfigured" // no Firebase env vars: the feature is hidden
  | "unsupported" // this browser cannot do web push
  | "blocked" // the user denied permission in browser settings
  | "off"
  | "on";

const TOKEN_KEY = "lm.pushToken";

function browserSupportsPush(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function storedToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function rememberToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Without storage the toggle just shows "off" after a reload.
  }
}

/**
 * Opt-in to web push on this device. Nothing runs, and no permission is ever
 * requested, until `enable()` is called from a tap. The Firebase SDK is
 * imported lazily so it never touches the main bundle.
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Browser inspection has to wait for the client; setting state here is the
    // point of the effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!readFirebaseConfig()) {
      setState("unconfigured");
    } else if (!browserSupportsPush()) {
      setState("unsupported");
    } else if (Notification.permission === "denied") {
      setState("blocked");
    } else if (Notification.permission === "granted" && storedToken()) {
      setState("on");
    } else {
      setState("off");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const enable = useCallback(async () => {
    const config = readFirebaseConfig();
    if (!config || !browserSupportsPush() || busy) return;

    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register(serviceWorkerUrl(config));
      await navigator.serviceWorker.ready;

      const [{ getApp, getApps, initializeApp }, { getMessaging, getToken, isSupported }] =
        await Promise.all([import("firebase/app"), import("firebase/messaging")]);
      if (!(await isSupported())) {
        setState("unsupported");
        return;
      }

      const app = getApps().length
        ? getApp()
        : initializeApp({
            apiKey: config.apiKey,
            projectId: config.projectId,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
          });
      const token = await getToken(getMessaging(app), {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) throw new Error("No token");

      const { error: saveError } = await createClient().rpc("register_push_token", {
        p_token: token,
        p_platform: "web",
        p_user_agent: navigator.userAgent,
      });
      if (saveError) throw saveError;

      rememberToken(token);
      setState("on");
    } catch {
      setError("Could not turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = storedToken();
      if (token) {
        const { error: deleteError } = await createClient()
          .from("push_tokens")
          .delete()
          .eq("token", token);
        if (deleteError) throw deleteError;

        try {
          const [{ getApps, getApp }, { getMessaging, deleteToken }] = await Promise.all([
            import("firebase/app"),
            import("firebase/messaging"),
          ]);
          if (getApps().length) await deleteToken(getMessaging(getApp()));
        } catch {
          // The server row is gone, so nothing will be sent to this device.
        }
      }
      rememberToken(null);
      setState("off");
    } catch {
      setError("Could not turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { state, busy, error, enable, disable };
}
