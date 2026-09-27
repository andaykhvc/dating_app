"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { startLesson } from "@/features/learn/api";
import { hasVoiceFor } from "@/features/learn/speech";
import type { LessonCompletion, LessonSession } from "@/features/learn/types";
import { SpeakButton, type Speech } from "./exercises/shared";
import { ShareToMatchSheet } from "./ShareToMatchSheet";

/**
 * The end of a lesson is where the product's point shows: a phrase from what
 * was just practised, and a way to take it to a real person. Offered, never
 * pushed — "Ask a match" opens a picker and fills the composer; the learner
 * decides whether to send.
 */
export function LessonComplete({
  session,
  completion,
  speech,
}: {
  session: LessonSession;
  completion: LessonCompletion;
  speech: Speech;
}) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [starting, setStarting] = useState(false);
  const phrase = completion.social_phrase;

  async function next() {
    if (!completion.next_lesson) return;
    setStarting(true);
    try {
      const s = await startLesson(
        completion.next_lesson.id,
        await hasVoiceFor(session.target.speech_locale),
      );
      router.push(`/play/lesson/${s.session_id}`);
    } catch {
      router.push("/play");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-gutter pb-safe-8 pt-safe-10 md:pt-safe-16">
        <div className="animate-pop space-y-2 text-center">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent">
            {session.mode === "review" ? "Review done" : completion.perfect ? "Perfect lesson" : "Lesson complete"}
          </p>
          <h1 className="text-balance text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-tight tracking-tight text-ink">
            {session.mode === "review"
              ? "Memory refreshed."
              : completion.perfect
                ? "Not a single slip."
                : "Nicely done."}
          </h1>
          {session.lesson && (
            <p className="text-sm text-muted">
              {session.lesson.skill_title} · {session.lesson.title}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2.5">
          <Stat label="XP" value={`+${completion.xp_awarded}`} tone="accent" />
          <Stat label="First try" value={`${completion.score}%`} />
          <Stat label="To review" value={String(completion.review_due)} />
        </dl>

        {phrase && (
          <section className="animate-rise rounded-3xl border border-line bg-raised p-5 [animation-delay:120ms] md:p-6">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand">
              Use it
            </p>
            <div className="mt-3 flex items-start gap-3">
              <SpeakButton text={phrase.text} speech={speech} />
              <div className="min-w-0">
                <p lang={session.target.code} className="text-xl font-bold leading-snug text-ink [overflow-wrap:anywhere]">
                  {phrase.text}
                </p>
                <p lang={session.known.code} className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">
                  {phrase.translation}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Try it on someone who actually speaks {session.target.name}. You
              choose who, and you can edit it before it goes anywhere.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => setSharing(true)}>
              Ask a match
            </Button>
          </section>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          {completion.next_lesson && (
            <>
              <p className="truncate text-center text-xs text-faint">
                Next: {completion.next_lesson.title}
              </p>
              <Button size="lg" fullWidth loading={starting} onClick={next}>
                Next lesson
              </Button>
            </>
          )}
          <Link
            href="/play"
            className={cn(
              "flex h-14 items-center justify-center rounded-full text-base font-semibold",
              completion.next_lesson
                ? "text-muted hover:bg-sunken hover:text-ink"
                : "bg-brand text-brand-ink hover:bg-brand-strong",
            )}
          >
            Back to your course
          </Link>
        </div>
      </main>

      {phrase && (
        <ShareToMatchSheet
          open={sharing}
          onClose={() => setSharing(false)}
          phrase={phrase}
          target={session.target}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <div className={cn("rounded-2xl px-2 py-3.5 text-center", tone === "accent" ? "bg-accent-soft" : "bg-sunken")}>
      <dt className="text-[0.6875rem] uppercase tracking-wide text-faint">{label}</dt>
      <dd className={cn("mt-0.5 text-xl font-bold tabular-nums", tone === "accent" ? "text-accent" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}
