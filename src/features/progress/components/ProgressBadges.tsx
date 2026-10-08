import { FlameIcon } from "@/components/icons";
import type { League, UserProgress } from "@/types/domain";
import { cn } from "@/lib/utils";

const LEAGUE_STYLE: Record<League, string> = {
  bronze: "bg-[#f6e5d5] text-[#8a5a2b] dark:bg-[#2e2118] dark:text-[#d9a273]",
  silver: "bg-[#e9eaef] text-[#5d6270] dark:bg-[#23252d] dark:text-[#b6bccb]",
  gold: "bg-[#fbeec2] text-[#8a6a12] dark:bg-[#2e2814] dark:text-[#e5c96b]",
};

export function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
      Level {level}
    </span>
  );
}

export function LeagueTag({ league }: { league: League }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        LEAGUE_STYLE[league],
      )}
    >
      {league}
    </span>
  );
}

export function StreakFlame({ days }: { days: number }) {
  const alive = days > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        alive ? "bg-accent-soft text-accent" : "bg-sunken text-faint",
      )}
      title={alive ? `${days} day streak` : "No streak — practise today to start one"}
    >
      <FlameIcon className="size-3.5" />
      {days}
    </span>
  );
}

export function XPBar({ progress }: { progress: UserProgress }) {
  const pct = Math.min(
    100,
    Math.round((progress.xp_into_level / progress.xp_for_next_level) * 100),
  );

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink">Level {progress.level}</span>
        <span className="text-faint">
          {progress.xp_into_level} / {progress.xp_for_next_level} XP
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to next level"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
