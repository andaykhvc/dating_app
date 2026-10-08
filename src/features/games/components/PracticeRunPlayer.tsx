"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  answerPracticeCard,
  finishPracticeRun,
  startPracticeRun,
  type PracticeFinish,
  type PracticeRunSession,
} from "@/features/games/api";
import { useSpeech, hasVoiceFor } from "@/features/learn/speech";
import type { ExerciseAnswer, ExerciseResult } from "@/features/learn/types";
import {
  Feedback,
  LISTENING,
  Renderer,
  TARGET_SOLUTION,
} from "@/features/learn/components/ExerciseRenderer";
import { PracticeSummary } from "./PracticeSummary";
import { ProgressFill } from "@/components/ui/ProgressFill";
import { haptic } from "@/lib/motion";

/**
 * A practice run: five cards, answer -> Next, XP only after the last one.
 *
 * Each answer is graded by one RPC. Results live on the server, so a refresh
 * resumes at the first unanswered card without ever seeing a key. No XP is
 * shown or promised per card; the summary reports it once.
 */
export function PracticeRunPlayer({ initial }: { initial: PracticeRunSession }) {
  const router = useRouter();
  const { exercises } = initial;
  const [results, setResults] = useState<Record<string, ExerciseResult>>(initial.results);
  const [current, setCurrent] = useState(() => {
    const open = exercises.findIndex((e) => !(String(e.index) in initial.results));
    return open === -1 ? exercises.length : open;
  });
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PracticeFinish | null>(null);
  const [leaving, setLeaving] = useState(false);
  const speech = useSpeech(initial.target.speech_locale);

  const exercise = exercises[current] ?? null;
  const result = exercise ? (results[String(exercise.index)] ?? null) : null;
  const answered = Object.keys(results).length;
  const total = exercises.length;
  const isLast = exercise ? exercise.index === total - 1 : false;
  const progress = total ? Math.round((answered / total) * 100) : 0;
  const over = initial.status !== "in_progress";

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setSummary(await finishPracticeRun(initial.run_id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish the run.");
    } finally {
      setBusy(false);
    }
  }, [busy, initial.run_id, router]);

  const submit = useCallback(
    async (given: ExerciseAnswer | null = answer) => {
      if (!exercise || !given || busy || result) return;
      setBusy(true);
      setError(null);
      try {
        const r = await answerPracticeCard(initial.run_id, exercise.index, given);
        setResults((prev) => ({ ...prev, [String(exercise.index)]: r }));
        if (r.correct === true) haptic(8);
        else if (r.correct === false) haptic([6, 50, 6]);
        if (TARGET_SOLUTION.has(exercise.type) && r.solution && r.correct !== null) {
          speech.speak(r.solution);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not check that answer. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [answer, busy, exercise, initial.run_id, result, speech],
  );

  // Never auto-advances: Next (or Finish on the last card) is the learner's call.
  const next = useCallback(() => {
    if (busy) return;
    setAnswer(null);
    if (isLast || current + 1 >= total) void finish();
    else setCurrent(current + 1);
  }, [busy, current, finish, isLast, total]);

  // Every card answered but the run never finished (tab closed on the last
  // card): the summary is one tap away instead of an empty screen.
  const needsFinish = !over && !summary && current >= total && total > 0;

  // Enter checks, then continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || leaving || summary) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (result) next();
      else void submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leaving, next, result, submit, summary]);

  // The browser's Back button asks first, too: the entry added here absorbs the
  // first Back and shows the confirmation instead of leaving.
  useEffect(() => {
    if (over || summary) return;
    window.history.pushState({ practice: true }, "", window.location.href);
    const onPop = () => {
      window.history.pushState({ practice: true }, "", window.location.href);
      setLeaving(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [over, summary]);

  async function another() {
    const audio = await hasVoiceFor(initial.target.speech_locale);
    const run = await startPracticeRun("quick", { style: initial.style ?? undefined, audio });
    if (run.available) router.push(`/play/practice/${run.run_id}`);
    else router.push("/play", { transitionTypes: ["nav-back"] });
  }

  if (summary) {
    return (
      <PracticeSummary
        summary={summary}
        kind={initial.kind}
        total={total}
        onAnother={initial.kind === "quick" ? another : undefined}
      />
    );
  }

  const title = initial.kind === "daily" ? "Daily challenge" : "Quick challenge";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="material safe-top sticky top-0 z-20 shadow-[0_0.5px_0_var(--separator)]">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-2 py-2 md:min-h-16 md:px-gutter">
          <button
            type="button"
            onClick={() => (over || needsFinish ? router.push("/play", { transitionTypes: ["nav-back"] }) : setLeaving(true))}
            aria-label="Leave challenge"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill md:-ml-2"
          >
            <CloseIcon className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-semibold text-muted">
                {initial.target.flag_emoji} {title}
              </p>
              <p className="shrink-0 text-[0.6875rem] tabular-nums text-faint" aria-live="polite">
                {Math.min(current + 1, total)} / {total}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Challenge progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-fill"
            >
              <ProgressFill value={progress} className="bg-brand" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-gutter pt-6 md:pt-10">
        {over ? (
          <div className="my-auto space-y-4 py-16 text-center">
            <p className="text-lg font-bold text-ink">This challenge is already over.</p>
            <Link href="/play" transitionTypes={["nav-back"]} className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink">
              Back to Play
            </Link>
          </div>
        ) : exercise ? (
          <div key={exercise.index} className="animate-advance">
            <Renderer
              exercise={exercise}
              result={result}
              onChange={setAnswer}
              onSubmit={() => (result ? next() : void submit())}
              speech={speech}
              target={initial.target}
              known={initial.known}
            />
          </div>
        ) : (
          <div className="my-auto flex flex-col items-center gap-3 py-16 text-center">
            {busy ? (
              <span className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            ) : (
              <>
                {error && <p role="alert" className="text-sm text-negative">{error}</p>}
                <Button onClick={finish} variant="secondary">
                  {error ? "Try again" : needsFinish ? "See my result" : "Finish"}
                </Button>
              </>
            )}
          </div>
        )}
      </main>

      {exercise && !over && (
        <footer
          className={cn(
            "safe-bottom sticky bottom-0 z-10 mt-8 transition-[background-color,box-shadow] duration-300 ease-ios",
            !result && "material shadow-[0_-0.5px_0_var(--separator)]",
            result?.correct === true && "bg-positive-soft shadow-[0_-1px_0_color-mix(in_oklab,var(--positive)_30%,transparent)]",
            result?.correct === false && "bg-negative-soft shadow-[0_-1px_0_color-mix(in_oklab,var(--negative)_30%,transparent)]",
            result && result.correct === null && "bg-sunken shadow-[0_-0.5px_0_var(--separator)]",
          )}
        >
          <div className="mx-auto max-w-2xl space-y-3 px-gutter py-4 md:py-5">
            {error && (
              <div role="alert" className="flex items-center justify-center gap-3 text-sm text-negative">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => (result ? void finish() : void submit())}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            {result && <Feedback result={result} exercise={exercise} />}
            <div className="flex gap-2.5">
              {!result && LISTENING.has(exercise.type) && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => submit({ skip: true })}
                  disabled={busy}
                  className="shrink-0 px-4"
                >
                  Can&rsquo;t listen now
                </Button>
              )}
              {result ? (
                <Button
                  size="lg"
                  fullWidth
                  autoFocus
                  loading={busy}
                  onClick={next}
                  className={cn(
                    result.correct === true && "bg-positive hover:bg-positive/90",
                    result.correct === false && "bg-negative hover:bg-negative/90",
                  )}
                >
                  {isLast ? "Finish" : "Next"}
                </Button>
              ) : (
                <Button size="lg" fullWidth loading={busy} disabled={!answer} onClick={() => submit()}>
                  Check
                </Button>
              )}
            </div>
          </div>
        </footer>
      )}

      <Sheet open={leaving} onClose={() => setLeaving(false)} title="Leave this challenge?">
        <p className="text-sm leading-relaxed text-muted">
          Your progress in this run is lost. You will not earn any XP for it.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="danger" fullWidth onClick={() => router.push("/play", { transitionTypes: ["nav-back"] })}>
            Leave
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setLeaving(false)}>
            Keep going
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
