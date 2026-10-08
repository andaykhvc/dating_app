"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "lm.timezone";

/**
 * Tells the database which timezone the signed-in user lives in, so streak days
 * roll over at their midnight rather than at UTC midnight. Runs once per
 * browser (again whenever the zone changes, e.g. after travelling); the server
 * validates the name and falls back to UTC.
 */
export function TimezoneSync() {
  useEffect(() => {
    let zone: string;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone) return;

    try {
      if (window.localStorage.getItem(STORAGE_KEY) === zone) return;
    } catch {
      // Storage can throw (private mode); just report the zone again.
    }

    createClient()
      .rpc("set_my_timezone", { p_timezone: zone })
      .then(({ error }) => {
        if (error) return;
        try {
          window.localStorage.setItem(STORAGE_KEY, zone);
        } catch {
          // Not persisted; harmless.
        }
      });
  }, []);

  return null;
}
