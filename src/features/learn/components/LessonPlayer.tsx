"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CloseIcon, FlagIcon } from "@/components/icons";
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
import { ChoiceExercise } from "./exercises/ChoiceExercise";
import { TypeExercise } from "./exercises/TypeExercise";
import { TileExercise } from "./exercises/TileExercise";
import { MatchPairs } from "./exercises/MatchPairs";
import { TrueFalse } from "./exercises/TrueFalse";
import { NewWords } from "./exercises/NewWords";
import type { ExerciseProps } from "./exercises/shared";
import { LessonComplete } from "./LessonComplete";
import { ReportSheet } from "./ReportSheet";

/** Exercises whose solution is written in the language being learned. */
const TARGET_SOLUTION = new Set([
  "vocab_recall", "type_translation", "listen_choice", "listen_type",
  "missing_word", "word_order", "word_bank", "context_choice",
]);

const LISTENING = new Set(["listen_choice", "listen_type"]);

function Renderer(props: ExerciseProps) {
  switch (props.exercise.type) {
    case "new_words":
      return <NewWords {...props} />;
    case "type_translation":
    case "listen_type":
      return <TypeExercise {...props} />;
    case "word_order":
    case "word_bank":
      return <TileExercise {...props} />;
    case "match_pairs":
      return <MatchPairs {...props} />;
    case "true_false":
      return <TrueFalse {...props} />;
    default:
      return <ChoiceExercise {...props} />;
  }
}

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
      <header className="safe-top sticky top-0 z-20 bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-2 py-2 md:min-h-16 md:px-gutter">
          <Link
            href="/play"
            aria-label="Leave lesson"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken md:-ml-2"
          >
            <CloseIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-semibold text-muted">
                {initial.target.flag_emoji} {title}
              </p>
              <p className="shrink-0 text-[0.6875rem] tabular-nums text-faint">
                {Math.min(answered + 1, exercises.length)} / {exercises.length}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-sunken"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-gutter pt-6 md:pt-10">
        {finished ? (
          <div className="my-auto space-y-4 py-16 text-center">
            <p className="text-lg font-bold text-ink">This lesson is already over.</p>
            <Link href="/play" className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink">
              Back to your course
            </Link>
          </div>
        ) : exercise ? (
          <div key={exercise.index} className="animate-rise">
            {exercise.is_retry && (
              <p className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
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
            {busy && <span className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />}
            {error && (
              <Button onClick={finish} variant="secondary">
                Try again
              </Button>
            )}
          </div>
        )}
      </main>

      {exercise && !finished && (
        <footer
          className={cn(
            "safe-bottom sticky bottom-0 z-10 mt-8 border-t transition-colors",
            !result && "border-line bg-surface/95 backdrop-blur-lg",
            result?.correct === true && "border-positive/30 bg-positive-soft",
            result?.correct === false && "border-negative/30 bg-negative-soft",
            result && result.correct === null && "border-line bg-sunken",
          )}
        >
          <div className="mx-auto max-w-2xl space-y-3 px-gutter py-4 md:py-5">
            {error && (
              <p role="alert" className="text-center text-sm text-negative">
                {error}
              </p>
            )}
            {result && exercise.type !== "new_words" && (
              <Feedback
                result={result}
                exercise={exercise}
                onReport={() => setReporting(true)}
              />
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

function Feedback({
  result,
  exercise,
  onReport,
}: {
  result: ExerciseResult;
  exercise: Exercise;
  onReport: () => void;
}) {
  const credit = exercise.payload.credit;
  const heading =
    result.correct === true
      ? result.note === "accents"
        ? "Right — mind the accents"
        : "Correct"
      : result.correct === false
        ? "Not quite"
        : "Here it is";

  // A choice answer was highlighted in place; spell out anything else.
  const showSolution =
    result.solution &&
    (result.correct !== true || result.note === "accents") &&
    !["vocab_choice", "vocab_recall", "listen_choice", "context_choice", "true_false"].includes(exercise.type);

  return (
    <div
      role="status"
      className={cn(
        "animate-rise flex items-start gap-3",
        result.correct === true && "text-positive",
        result.correct === false && "text-negative",
        result.correct === null && "text-ink",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold">{heading}</p>
        {showSolution && (
          <p className="mt-0.5 text-sm [overflow-wrap:anywhere]">
            <span className="opacity-75">Answer: </span>
            {result.solution}
          </p>
        )}
        {exercise.type === "true_false" && result.correct === false && result.solution && (
          <p className="mt-0.5 text-sm [overflow-wrap:anywhere]">
            <span className="opacity-75">It means: </span>
            {result.solution}
          </p>
        )}
        {credit && (
          <p className="mt-1 text-[0.6875rem] opacity-75">
            {credit.url ? (
              <a href={credit.url} target="_blank" rel="noreferrer" className="underline">
                Sentence
              </a>
            ) : (
              "Sentence"
            )}{" "}
            by {credit.author ?? "unknown"} · {credit.source} · {credit.license}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onReport}
        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
      >
        <FlagIcon className="size-3.5" /> Report
      </button>
    </div>
  );
}
