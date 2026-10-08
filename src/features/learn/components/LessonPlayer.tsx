"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { answerExercise, completeLesson } from "@/features/learn/api";
import { useSpeech } from "@/features/learn/speech";
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseResult,
  LessonCompletion,
  LessonSession,
} from "@/features/learn/types";
import { Feedback, LISTENING, Renderer, TARGET_SOLUTION } from "./ExerciseRenderer";
import { LessonComplete } from "./LessonComplete";
import { ReportSheet } from "./ReportSheet";
import { ProgressFill } from "@/components/ui/ProgressFill";
import { haptic } from "@/lib/motion";

/**
 * One lesson or review, start to finish. Each answer is graded by one RPC;
 * a miss comes back once at the end. A refresh resumes at the first
 * unanswered exercise because results live on the server.
 */
export function LessonPlayer({ initial }: { initial: LessonSession }) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>(initial.exercises);
  const [results, setResults] = useState<Record<string, ExerciseResult>>(initial.results);
  const [current, setCurrent] = useState(() => {
    const open = initial.exercises.findIndex((e) => !(String(e.index) in initial.results));
    return open === -1 ? initial.exercises.length : open;
  });
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<LessonCompletion | null>(null);
  const [reporting, setReporting] = useState(false);
  const speech = useSpeech(initial.target.speech_locale);

  const exercise = exercises[current] ?? null;
  const result = exercise ? results[String(exercise.index)] ?? null : null;
  const answered = Object.keys(results).length;
  const progress = exercises.length ? Math.round((answered / exercises.length) * 100) : 0;
  const finished = initial.status !== "in_progress";

  const finish = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setCompletion(await completeLesson(initial.session_id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish the lesson.");
    } finally {
      setBusy(false);
    }
  }, [initial.session_id, router]);

  const advance = useCallback(
    (list: Exercise[], done: Record<string, ExerciseResult>) => {
      setAnswer(null);
      const next = list.findIndex((e) => !(String(e.index) in done));
      if (next === -1) {
        setCurrent(list.length);
        finish();
      } else {
        setCurrent(next);
      }
    },
    [finish],
  );

  const submit = useCallback(
    async (given: ExerciseAnswer | null = answer) => {
      if (!exercise || !given || busy || result) return;
      setBusy(true);
      setError(null);
      try {
        const r = await answerExercise(initial.session_id, exercise.index, given);
        const nextResults = { ...results, [String(exercise.index)]: r };
        const nextList = r.appended ? [...exercises, r.appended] : exercises;
        setResults(nextResults);
        setExercises(nextList);
        // Right gets a light tick, wrong a softer double — felt on the same
        // frame the colour changes, so the two read as one event.
        if (r.correct === true) haptic(8);
        else if (r.correct === false) haptic([6, 50, 6]);
        if (exercise.type === "new_words") {
          advance(nextList, nextResults);
        } else if (TARGET_SOLUTION.has(exercise.type) && r.solution && r.correct !== null) {
          speech.speak(r.solution);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not check that answer.");
      } finally {
        setBusy(false);
      }
    },
    [answer, busy, exercise, exercises, initial.session_id, result, results, advance, speech],
  );

  // Everything answered but never finished (tab closed on the last screen,
  // or finishing failed): finish now rather than showing an empty lesson.
  useEffect(() => {
    if (initial.status === "in_progress" && current >= exercises.length && exercises.length > 0) {
      const timer = setTimeout(finish, 0);
      return () => clearTimeout(timer);
    }
    // Only when the session is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enter checks, then continues — the keyboard path through a whole lesson.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || reporting || completion) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (result) advance(exercises, results);
      else submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, completion, exercises, reporting, result, results, submit]);

  const title = useMemo(
    () => (initial.mode === "review" ? "Review" : initial.lesson?.title ?? "Lesson"),
    [initial.mode, initial.lesson],
  );

  if (completion) {
    return <LessonComplete session={initial} completion={completion} speech={speech} />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="material safe-top sticky top-0 z-20 shadow-[0_0.5px_0_var(--separator)]">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-2 py-2 md:min-h-16 md:px-gutter">
          <Link
            href="/play" transitionTypes={["nav-back"]}
            aria-label="Leave lesson"
            className="press flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill md:-ml-2"
          >
            <CloseIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-semibold text-muted">
                {initial.target.flag_emoji} {title}
              </p>
              <p className="shrink-0 text-xs tabular-nums text-faint">
                {Math.min(answered + 1, exercises.length)} / {exercises.length}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Lesson progress"
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
        {finished ? (
          <div className="my-auto space-y-4 py-16 text-center">
            <p className="text-lg font-bold text-ink">This lesson is already over.</p>
            <Link href="/play" transitionTypes={["nav-back"]} className="press inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink">
              Back to your course
            </Link>
          </div>
        ) : exercise ? (
          <div key={exercise.index} className="animate-advance">
            {exercise.is_retry && (
              <p className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
                One more try
              </p>
            )}
            <Renderer
              exercise={exercise}
              result={result}
              onChange={setAnswer}
              onSubmit={() => (result ? advance(exercises, results) : submit())}
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
                  {error ? "Try again" : "Finish lesson"}
                </Button>
              </>
            )}
          </div>
        )}
      </main>

      {exercise && !finished && (
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
              <p role="alert" className="text-center text-sm text-negative">
                {error}
              </p>
            )}
            {result && exercise.type !== "new_words" && (
              <div className="animate-rise">
              <Feedback
                result={result}
                exercise={exercise}
                onReport={() => setReporting(true)}
              />
              </div>
            )}
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
                  onClick={() => advance(exercises, results)}
                  className={cn(
                    result.correct === true && "bg-positive hover:bg-positive/90",
                    result.correct === false && "bg-negative hover:bg-negative/90",
                  )}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  size="lg"
                  fullWidth
                  loading={busy}
                  disabled={!answer}
                  onClick={() => submit()}
                >
                  {exercise.type === "new_words" ? "Continue" : "Check"}
                </Button>
              )}
            </div>
          </div>
        </footer>
      )}

      <ReportSheet
        open={reporting}
        onClose={() => setReporting(false)}
        sessionId={initial.session_id}
        index={exercise?.index ?? 0}
      />
    </div>
  );
}
