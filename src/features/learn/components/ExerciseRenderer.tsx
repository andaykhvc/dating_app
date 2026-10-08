import { FlagIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Exercise, ExerciseResult } from "@/features/learn/types";
import { ChoiceExercise } from "./exercises/ChoiceExercise";
import { TypeExercise } from "./exercises/TypeExercise";
import { TileExercise } from "./exercises/TileExercise";
import { MatchPairs } from "./exercises/MatchPairs";
import { TrueFalse } from "./exercises/TrueFalse";
import { NewWords } from "./exercises/NewWords";
import type { ExerciseProps } from "./exercises/shared";

/*
 * Shared by the lesson player and the practice-run player: which renderer an
 * exercise type uses, and the feedback shown after an answer.
 */

/** Exercises whose solution is written in the language being learned. */
export const TARGET_SOLUTION = new Set([
  "vocab_recall", "type_translation", "listen_choice", "listen_type",
  "missing_word", "word_order", "word_bank", "context_choice",
]);

export const LISTENING = new Set(["listen_choice", "listen_type"]);

export function Renderer(props: ExerciseProps) {
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

export function Feedback({
  result,
  exercise,
  onReport,
}: {
  result: ExerciseResult;
  exercise: Exercise;
  /** Omit where there is nothing to report against (practice runs). */
  onReport?: () => void;
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
          <p className="mt-1 text-xs opacity-75">
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
      {onReport && (
        <button
          type="button"
          onClick={onReport}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          <FlagIcon className="size-3.5" /> Report
        </button>
      )}
    </div>
  );
}
