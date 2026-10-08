import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { HeroPreview } from "@/components/marketing/HeroPreview";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { APP_NAME, VALUE_PROPS } from "@/lib/constants";
import { LegalLinks } from "@/components/legal/LegalLinks";

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-gutter pb-safe-10 pt-safe-14 short:pt-safe-8 md:max-w-lg lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:content-center lg:items-center lg:gap-20 lg:py-16 xl:gap-28">
      <div className="flex flex-1 flex-col lg:flex-none">
        <div className="flex items-center gap-3 text-brand">
          <LogoMark className="size-10" />
          <span className="text-lg font-bold tracking-tight text-ink">
            {APP_NAME}
          </span>
        </div>

        <h1 className="mt-12 text-[clamp(2.25rem,9vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-ink short:mt-8 lg:mt-14">
          Learn a language
          <br />
          with someone
          <br />
          <span className="text-brand">real.</span>
        </h1>

        <p className="mt-5 text-base leading-relaxed text-muted lg:max-w-lg lg:text-lg">
          Meet native speakers across Europe and the US, practise together, and
          keep a streak going. Language partners first — dating only if you both
          say so.
        </p>

        <ul className="mt-10 space-y-5 short:mt-7">
          {VALUE_PROPS.map((step, i) => (
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

        <div className="mt-auto space-y-3 pt-12 lg:mt-12 lg:max-w-sm lg:pt-0">
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

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-muted">or continue with</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <OAuthButtons />

          <p className="pt-2 text-center text-xs text-faint">
            18+ only. Report and block are always one tap away.{" "}
            <Link href="/licenses" className="underline hover:text-muted">
              Licenses
            </Link>
          </p>
          <footer><LegalLinks /></footer>
        </div>
      </div>

      <HeroPreview className="hidden lg:block" />
    </main>
  );
}
