import Link from "next/link";

export function LeaderboardLink() {
  return (
    <Link
      href="/play/rankings" transitionTypes={["nav-forward"]}
      className="flex items-center gap-3 rounded-3xl border border-brand/20 bg-brand-soft/60 p-5 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <span aria-hidden="true" className="text-3xl">
        🏆
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">XP rankings</span>
        <span className="block text-sm text-muted">
          See how your learning adds up.
        </span>
      </span>
      <span aria-hidden="true" className="text-brand">
        →
      </span>
    </Link>
  );
}
