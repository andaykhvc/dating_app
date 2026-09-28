import Link from "next/link";
import { PageBody } from "@/components/layout/Page";

export default function ProfileNotFound() {
  return (
    <PageBody className="space-y-4 text-center">
      <h1 className="text-xl font-bold text-ink">Profile unavailable</h1>
      <p className="text-sm text-muted">
        This learner’s profile is no longer available to view.
      </p>
      <Link
        href="/play/rankings"
        className="inline-block rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-ink"
      >
        Back to XP rankings
      </Link>
    </PageBody>
  );
}
