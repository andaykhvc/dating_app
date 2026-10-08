"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { sharePhrase } from "@/features/learn/api";
import type { LanguageInfo, SocialPhrase } from "@/features/learn/types";
import type { MatchSummary } from "@/types/domain";

/**
 * Pick who to try the phrase on. People who speak the language natively come
 * first — they are the ones who can tell you whether it landed. Choosing a
 * match opens the chat with the phrase in the composer, unsent.
 */
export function ShareToMatchSheet({
  open,
  onClose,
  phrase,
  target,
}: {
  open: boolean;
  onClose: () => void;
  phrase: SocialPhrase;
  target: LanguageInfo;
}) {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || matches) return;
    createClient()
      .rpc("get_matches")
      .then(({ data }) => {
        const active = ((data ?? []) as MatchSummary[]).filter((m) => m.status === "active");
        const speaks = (m: MatchSummary) =>
          m.partner.languages.some((l) => l.role === "native" && l.language_code === target.code);
        setMatches([...active].sort((a, b) => Number(speaks(b)) - Number(speaks(a))));
      });
  }, [open, matches, target.code]);

  async function choose(matchId: string) {
    setOpening(matchId);
    setError(null);
    try {
      const share = await sharePhrase(matchId, phrase.concept_id);
      router.push(`/messages/${matchId}?phrase=${share.share_id}`);
    } catch {
      setError("Could not open that chat.");
      setOpening(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Who do you want to ask?">
      <p lang={target.code} className="mb-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
        {phrase.text}
      </p>

      {matches === null ? (
        <div className="flex justify-center py-8">
          <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : matches.length === 0 ? (
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm text-muted">
            No matches yet. Find someone who speaks {target.name} and this
            phrase will be waiting for you.
          </p>
          <Link href="/discover" className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink">
            Find someone
          </Link>
        </div>
      ) : (
        <ul className="-mx-2 space-y-1">
          {matches.map((m) => {
            const native = m.partner.languages.find((l) => l.role === "native");
            const speaks = native?.language_code === target.code;
            return (
              <li key={m.match_id}>
                <button
                  type="button"
                  onClick={() => choose(m.match_id)}
                  disabled={opening !== null}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-fill disabled:opacity-60"
                >
                  <Avatar storagePath={m.partner.primary_photo_path} name={m.partner.first_name} userId={m.partner.id} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{m.partner.first_name}</span>
                    <span className="block truncate text-xs text-faint">
                      {speaks ? `Speaks ${target.name}` : native ? `Speaks ${native.language_name}` : ""}
                    </span>
                  </span>
                  {opening === m.match_id ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  ) : (
                    speaks && (
                      <span className="shrink-0 rounded-full bg-positive-soft px-2 py-0.5 text-xs font-semibold text-positive">
                        Native
                      </span>
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-negative">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-xs text-faint">
        Sending it in the chat earns +10 XP (up to three phrases a day).
      </p>
    </Sheet>
  );
}
