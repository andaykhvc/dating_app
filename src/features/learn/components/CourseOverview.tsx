"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { startLesson, startReview } from "@/features/learn/api";
import { hasVoiceFor } from "@/features/learn/speech";
import type { LearnOverview, SkillSummary, UnitSummary } from "@/features/learn/types";

type Starter = {
  start: (lessonId: number | "review") => Promise<void>;
  starting: number | "review" | null;
  error: string | null;
};

function useStarter(locale: string | null | undefined): Starter {
  const router = useRouter();
  const [starting, setStarting] = useState<number | "review" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(lessonId: number | "review") {
    if (starting !== null) return;
    setStarting(lessonId);
    setError(null);
    try {
      // Lessons are generated without listening exercises when this device
      // has no voice for the language.
      const audio = await hasVoiceFor(locale);
      const session =
        lessonId === "review" ? await startReview(audio) : await startLesson(lessonId, audio);
      router.push(`/play/lesson/${session.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start that.");
      setStarting(null);
    }
  }

  return { start, starting, error };
}

/** Headline card: where you are, what's next, what's due. */
export function CourseCard({ overview }: { overview: LearnOverview }) {
  const course = overview.course;
  const starter = useStarter(course?.target.speech_locale);

  if (!course) {
    return (
      <section className="rounded-3xl border border-dashed border-line p-5 text-center md:p-6">
        <p className="text-sm font-semibold text-ink">No course for your learning language yet</p>
        <p className="mt-1 text-sm text-muted">
          Courses exist for German, Spanish, Dutch, Turkish and English. You can
          change your learning language in your profile.
        </p>
      </section>
    );
  }

  const review = overview.review;
  const next = overview.next_lesson;
  const pct = course.lessons_total
    ? Math.round((course.lessons_completed / course.lessons_total) * 100)
    : 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-raised">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sunken text-2xl" aria-hidden>
            {course.target.flag_emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-ink">
              {course.target.name}
              {course.level && (
                <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 align-middle text-xs font-bold text-brand">
                  {course.level}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              Explained in {course.known.name} · {course.lessons_completed} of {course.lessons_total} lessons
            </p>
          </div>
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken"
          role="progressbar"
          aria-label="Course progress"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>

        {next ? (
          <div className="mt-5">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint">Up next</p>
            <p className="mt-1 truncate text-base font-semibold text-ink">{next.title}</p>
            <p className="truncate text-xs text-muted">
              {next.cefr_level} · {next.unit_title} · {next.skill_title}
            </p>
            <Button
              size="lg"
              fullWidth
              className="mt-3"
              loading={starter.starting === next.id}
              disabled={starter.starting !== null}
              onClick={() => starter.start(next.id)}
            >
              {course.lessons_completed === 0 ? "Start your first lesson" : "Continue"}
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">
            Every lesson done. Reviews keep it fresh — and your matches are the real test.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line bg-sunken/60 px-5 py-3.5 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {review && review.due > 0 ? `${review.due} to review` : "Review"}
          </p>
          <p className="truncate text-xs text-faint">
            {review && review.seen > 0
              ? `${review.learned} learned · ${review.mastered} mastered`
              : "Words you learn come back here to stick"}
          </p>
        </div>
        <Button
          variant={review && review.due > 0 ? "primary" : "secondary"}
          disabled={!review || review.seen < 3 || starter.starting !== null}
          loading={starter.starting === "review"}
          onClick={() => starter.start("review")}
        >
          Review
        </Button>
      </div>
      {starter.error && (
        <p role="alert" className="px-5 pb-4 text-center text-xs text-negative md:px-6">
          {starter.error}
        </p>
      )}
    </section>
  );
}

/**
 * The whole course as a syllabus: units that open into skills, skills that
 * list their lessons. Everything is open — adults pick what they need — but
 * the unit holding "up next" starts expanded so the path is obvious.
 */
export function Syllabus({ overview }: { overview: LearnOverview }) {
  const units = overview.units ?? [];
  const nextId = overview.next_lesson?.id;
  const starter = useStarter(overview.course?.target.speech_locale);
  const [open, setOpen] = useState<Set<number>>(() => {
    const withNext = units.find((u) => u.skills.some((s) => s.lessons.some((l) => l.id === nextId)));
    return new Set(withNext ? [withNext.id] : units.slice(0, 1).map((u) => u.id));
  });

  if (units.length === 0) return null;

  const levels = [...new Set(units.map((u) => u.cefr_level))];

  return (
    <div className="space-y-6">
      {levels.map((level) => (
        <section key={level} aria-label={`Level ${level}`}>
          <h2 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-faint">
            <span className="rounded-md bg-ink px-1.5 py-0.5 text-[0.625rem] font-bold text-surface">{level}</span>
            {level === "A1" ? "Beginner" : "Elementary"}
          </h2>
          <ol className="space-y-2.5">
            {units
              .filter((u) => u.cefr_level === level)
              .map((unit) => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  number={units.indexOf(unit) + 1}
                  expanded={open.has(unit.id)}
                  onToggle={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(unit.id)) next.delete(unit.id);
                      else next.add(unit.id);
                      return next;
                    })
                  }
                  nextId={nextId}
                  starter={starter}
                />
              ))}
          </ol>
        </section>
      ))}
      {starter.error && (
        <p role="alert" className="text-center text-xs text-negative">
          {starter.error}
        </p>
      )}
    </div>
  );
}

function UnitRow({
  unit,
  number,
  expanded,
  onToggle,
  nextId,
  starter,
}: {
  unit: UnitSummary;
  number: number;
  expanded: boolean;
  onToggle: () => void;
  nextId: number | undefined;
  starter: Starter;
}) {
  const lessons = unit.skills.flatMap((s) => s.lessons);
  const done = lessons.filter((l) => l.completed).length;
  const complete = done === lessons.length && lessons.length > 0;

  return (
    <li className="overflow-hidden rounded-3xl border border-line bg-raised">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-sunken/50 md:px-5 md:py-4"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums",
            complete ? "bg-positive-soft text-positive" : done > 0 ? "bg-brand-soft text-brand" : "bg-sunken text-muted",
          )}
        >
          {complete ? "✓" : number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-semibold text-ink">{unit.title}</span>
          <span className="block truncate text-xs text-faint">
            {done}/{lessons.length} lessons · {unit.description}
          </span>
        </span>
        <span className={cn("shrink-0 text-xs text-muted transition-transform", expanded && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>

      {expanded && (
        <ul className="grid gap-2 border-t border-line p-3 sm:grid-cols-2 md:p-4">
          {unit.skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} nextId={nextId} starter={starter} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SkillCard({ skill, nextId, starter }: { skill: SkillSummary; nextId: number | undefined; starter: Starter }) {
  return (
    <li className="rounded-2xl bg-sunken/60 p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-raised text-lg" aria-hidden>
          {skill.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{skill.title}</p>
          <p className="truncate text-xs text-faint">{skill.description}</p>
        </div>
      </div>

      {/* Mastery is the spaced-repetition state of the skill's words, so it
          can go down again if they are not reviewed. */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label={`${skill.title} mastery`}
          aria-valuenow={skill.mastery}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${skill.mastery}%` }} />
        </div>
        <span className="w-8 text-right text-[0.625rem] font-semibold tabular-nums text-faint">{skill.mastery}%</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skill.lessons.map((lesson, i) => {
          const isNext = lesson.id === nextId;
          const label = lesson.lesson_type === "practice" ? "Practice" : `Lesson ${i + 1}`;
          return (
            <button
              key={lesson.id}
              type="button"
              title={lesson.title}
              onClick={() => starter.start(lesson.id)}
              disabled={starter.starting !== null}
              className={cn(
                "inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-[transform,colors] active:scale-95 disabled:opacity-60",
                isNext
                  ? "bg-brand text-brand-ink shadow-sm shadow-brand/30"
                  : lesson.completed
                    ? "bg-positive-soft text-positive"
                    : "border border-line bg-raised text-muted hover:border-brand/40 hover:text-ink",
              )}
            >
              {starter.starting === lesson.id ? (
                <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                lesson.completed && <span aria-hidden>✓</span>
              )}
              {label}
              {lesson.completed && <span className="sr-only">(done)</span>}
            </button>
          );
        })}
      </div>
    </li>
  );
}
