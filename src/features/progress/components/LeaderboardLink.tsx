import Link from "next/link";

export function LeaderboardLink() {
  return (
    <Link
      href="/play/rankings" transitionTypes={["nav-forward"]}
      className="press-soft flex items-center gap-3 rounded-[var(--radius-group)] bg-brand-soft p-5 hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand dark:hover:brightness-110"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-[0.8rem] bg-raised text-2xl shadow-[var(--shadow-card)]"
      >
        🏆
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">XP rankings</span>
        <span className="block text-sm text-muted">
          See how your learning adds up.
        </span>
      </span>
      <span aria-hidden="true" className="text-lg text-brand">
        ›
      </span>
    </Link>
  );
}
