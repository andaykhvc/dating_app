import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { APP_NAME, APP_TAGLINE, VALUE_PROPS } from "@/lib/constants";
import { PrivacyLinks } from "@/components/legal/PrivacyLinks";

/**
 * Phones: the form alone. Desktop: the form on the right with a brand panel on
 * the left, so a 420px form is not floating in an empty monitor.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between overflow-hidden bg-brand p-12 text-brand-ink lg:flex xl:p-16">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="max-w-md">
          <p className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            {APP_TAGLINE}
          </p>
          <ul className="mt-10 space-y-6">
            {VALUE_PROPS.map((prop, i) => (
              <li key={prop.title} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{prop.title}</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">{prop.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-70">
          18+ only. Report and block are always one tap away.
        </p>
      </aside>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-gutter pb-safe-10 pt-safe-12 short:pt-safe-8 lg:py-16">
        <Link href="/" className="flex items-center gap-2.5 text-brand lg:hidden">
          <LogoMark className="size-8" />
          <span className="font-bold tracking-tight text-ink">{APP_NAME}</span>
        </Link>
        <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
        <footer><PrivacyLinks /></footer>
      </main>
    </div>
  );
}
