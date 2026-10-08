import Link from "next/link";

export type PhotoReviewState = "pending" | "rejected" | "none";

const COPY: Record<PhotoReviewState, { text: string; cta: string; href: string }> = {
  pending: {
    text: "Your photo is being checked, usually within a day. Others will see you in Discover once it is approved.",
    cta: "Photos",
    href: "/profile/edit",
  },
  rejected: {
    text: "Your photo was not approved, so others cannot see you yet. Add a new one to appear in Discover.",
    cta: "Replace photo",
    href: "/profile/edit",
  },
  none: {
    text: "Add a photo so others can find you in Discover.",
    cta: "Add photo",
    href: "/profile/edit",
  },
};

/** A slim strip above the deck while the person is not yet shown to others. */
export function PhotoReviewNotice({ state }: { state: PhotoReviewState }) {
  const { text, cta, href } = COPY[state];
  return (
    <p
      role="status"
      className="flex shrink-0 items-center gap-3 bg-accent-soft px-gutter py-2.5 text-xs leading-snug text-ink"
    >
      <span className="min-w-0 flex-1">{text}</span>
      <Link href={href} className="shrink-0 font-semibold text-accent underline-offset-2 hover:underline">
        {cta}
      </Link>
    </p>
  );
}
