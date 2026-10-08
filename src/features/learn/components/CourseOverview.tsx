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
  const reviewDue = review?.due ?? 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-raised">
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3">
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
            <p className="mt-0.5 truncate text-xs text-faint">Explained in {course.known.name}</p>
          </div>
        </div>

        {next ? (
          <div className="mt-5">
            <p className="truncate text-base font-semibold text-ink">{next.title}</p>
            <p className="truncate text-xs text-muted">
              {next.unit_title} · {next.skill_title}
            </p>
            <Button
              size="lg"
              fullWidth
              className="mt-3"
              loading={starter.starting === next.id}
              disabled={starter.starting !== null}
              onClick={() => starter.start(next.id)}
            >
              {course.lessons_completed === 0 ? "Start" : "Continue"}
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">
            Every lesson done. Reviews keep it fresh — and your matches are the real test.
          </p>
        )}

        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken"
          role="progressbar"
          aria-label={`Course progress: ${course.lessons_completed} of ${course.lessons_total} lessons`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-line bg-sunken/60 px-5 py-2.5 md:px-6">
        <p className="min-w-0 flex-1 truncate text-sm text-muted">
          {reviewDue > 0 ? `${reviewDue} to review` : "Nothing to review yet"}
        </p>
        <Button
          variant="secondary"
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
 * only the unit holding "up next" starts expanded, and a skill shows its
 * lessons only once it is opened.
 */
export function Syllabus({ overview }: { overview: LearnOverview }) {
  const units = overview.units ?? [];
  const nextId = overview.next_lesson?.id;
  const starter = useStarter(overview.course?.target.speech_locale);
  const [openUnits, setOpenUnits] = useState<Set<number>>(() => {
    const withNext = units.find((u) => u.skills.some((s) => s.lessons.some((l) => l.id === nextId)));
    return new Set(withNext ? [withNext.id] : units.slice(0, 1).map((u) => u.id));
  });
  const [openSkills, setOpenSkills] = useState<Set<number>>(() => {
    const withNext = units.flatMap((u) => u.skills).find((s) => s.lessons.some((l) => l.id === nextId));
    return new Set(withNext ? [withNext.id] : []);
  });

  if (units.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <ol className="space-y-2.5">
        {units.map((unit, index) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            number={index + 1}
            expanded={openUnits.has(unit.id)}
            onToggle={() => setOpenUnits((prev) => toggled(prev, unit.id))}
            openSkills={openSkills}
            onToggleSkill={(id) => setOpenSkills((prev) => toggled(prev, id))}
            nextId={nextId}
            starter={starter}
          />
        ))}
      </ol>
      {starter.error && (
        <p role="alert" className="text-center text-xs text-negative">
          {starter.error}
        </p>
      )}
    </div>
  );
}

function toggled(set: Set<number>, id: number): Set<number> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** "All lessons": the syllabus behind one collapsed control. */
export function SyllabusAccordion({ overview }: { overview: LearnOverview }) {
  const [open, setOpen] = useState(false);
  if (!overview.units || overview.units.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="all-lessons"
        className="flex w-full items-center justify-between rounded-3xl border border-line bg-raised px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        All lessons
        <span className={cn("text-xs text-muted transition-transform", open && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div id="all-lessons" className="mt-2.5">
          <Syllabus overview={overview} />
        </div>
      )}
    </section>
  );
}

function UnitRow({
  unit,
  number,
  expanded,
  onToggle,
  openSkills,
  onToggleSkill,
  nextId,
  starter,
}: {
  unit: UnitSummary;
  number: number;
  expanded: boolean;
  onToggle: () => void;
  openSkills: Set<number>;
  onToggleSkill: (skillId: number) => void;
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
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken/50 md:px-5"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums",
            complete ? "bg-positive-soft text-positive" : done > 0 ? "bg-brand-soft text-brand" : "bg-sunken text-muted",
          )}
        >
          {complete ? "✓" : number}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-ink">{unit.title}</span>
        <span className="shrink-0 text-xs tabular-nums text-faint">
          {done}/{lessons.length}
          <span className="sr-only"> lessons done</span>
        </span>
        <span className={cn("shrink-0 text-xs text-muted transition-transform", expanded && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>

      {expanded && (
        <ul className="divide-y divide-line border-t border-line">
          {unit.skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              expanded={openSkills.has(skill.id)}
              onToggle={() => onToggleSkill(skill.id)}
              nextId={nextId}
              starter={starter}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function skillState(skill: SkillSummary, nextId: number | undefined): string {
  const done = skill.lessons.filter((l) => l.completed).length;
  if (done === skill.lessons.length && skill.lessons.length > 0) return "Done";
  if (skill.lessons.some((l) => l.id === nextId)) return "Current";
  return done > 0 ? "In progress" : "Not started";
}

function SkillRow({
  skill,
  expanded,
  onToggle,
  nextId,
  starter,
}: {
  skill: SkillSummary;
  expanded: boolean;
  onToggle: () => void;
  nextId: number | undefined;
  starter: Starter;
}) {
  const state = skillState(skill, nextId);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sunken/50 md:px-5"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sunken text-base" aria-hidden>
          {skill.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{skill.title}</span>
          {/* Mastery is the spaced-repetition state of the skill's words, so it
              can go down again if they are not reviewed. */}
          <span
            className="mt-1 block h-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label={`${skill.title} mastery`}
            aria-valuenow={skill.mastery}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="block h-full rounded-full bg-accent" style={{ width: `${skill.mastery}%` }} />
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            state === "Done" ? "text-positive" : state === "Current" ? "text-brand" : "text-faint",
          )}
        >
          {state}
        </span>
        <span className={cn("shrink-0 text-xs text-muted transition-transform", expanded && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3.5 pl-[3.75rem] md:px-5 md:pl-[4.25rem]">
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
                  "inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-[transform,colors] active:scale-95 disabled:opacity-60",
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
      )}
    </li>
  );
}
