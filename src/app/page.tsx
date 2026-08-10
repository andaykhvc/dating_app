import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

const STEPS = [
  {
    title: "Find someone worth talking to",
    body: "Swipe through people who speak what you are learning — and are learning what you speak.",
  },
  {
    title: "Never stare at an empty chat",
    body: "Every match arrives with a mission. A real thing to talk about, from the first message.",
  },
  {
    title: "Fix each other's mistakes",
    body: "Tap any message to suggest a correction. You both earn XP — no robot marking your grammar.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16">
      <div className="flex items-center gap-3 text-brand">
        <LogoMark className="size-10" />
        <span className="text-lg font-bold tracking-tight text-ink">
          {APP_NAME}
        </span>
      </div>

      <h1 className="mt-12 text-4xl font-bold leading-[1.1] tracking-tight text-ink">
        Learn a language
        <br />
        with someone
        <br />
        <span className="text-brand">real.</span>
      </h1>

      <p className="mt-5 text-base leading-relaxed text-muted">
        Meet native speakers across Europe and the US, practise together, and
        keep a streak going. Language partners first — dating only if you both
        say so.
      </p>

      <ul className="mt-10 space-y-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-12">
        <Link
          href="/signup"
          className="flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-brand-ink transition-colors hover:bg-brand-strong"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="flex h-14 w-full items-center justify-center rounded-full border border-line bg-raised text-base font-semibold text-ink transition-colors hover:border-brand/40"
        >
          I already have one
        </Link>
        <p className="pt-2 text-center text-xs text-faint">
          18+ only. Report and block are always one tap away.
        </p>
      </div>
    </main>
  );
}
