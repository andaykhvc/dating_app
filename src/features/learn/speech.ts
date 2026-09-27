"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Listening exercises use the browser's own speech synthesis: free, on-device,
 * no audio files and no paid TTS. Voices vary by device, so everything here
 * degrades: no matching voice means listening exercises are left out of new
 * lessons, and a "can't listen now" skip covers the ones already generated.
 *
 * A voice is only used when its language matches — a German sentence read by
 * an English voice teaches the wrong thing.
 */

function speechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function pickVoice(voices: SpeechSynthesisVoice[], locale: string) {
  const want = locale.toLowerCase();
  const lang = want.slice(0, 2);
  const matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  return (
    matches.find((v) => v.lang.toLowerCase().replace("_", "-") === want && v.localService) ??
    matches.find((v) => v.lang.toLowerCase().replace("_", "-") === want) ??
    matches.find((v) => v.localService) ??
    matches[0] ??
    null
  );
}

/** Resolves once the browser has listed its voices (Chrome loads them late). */
function loadVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  if (!speechAvailable()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(window.speechSynthesis.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    window.speechSynthesis.addEventListener("voiceschanged", done);
  });
}

export async function hasVoiceFor(locale: string | null | undefined): Promise<boolean> {
  if (!locale) return false;
  return pickVoice(await loadVoices(), locale) !== null;
}

export function useSpeech(locale: string | null | undefined) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!locale) {
      queueMicrotask(() => alive && setChecked(true));
      return;
    }
    loadVoices().then((voices) => {
      if (!alive) return;
      setVoice(pickVoice(voices, locale));
      setChecked(true);
    });
    return () => {
      alive = false;
      if (speechAvailable()) window.speechSynthesis.cancel();
    };
  }, [locale]);

  const speak = useCallback(
    (text: string, slow = false) => {
      if (!voice || !speechAvailable()) return false;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = slow ? 0.6 : 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [voice],
  );

  return { canSpeak: voice !== null, checked, speak };
}
