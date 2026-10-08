/**
 * A still of the product for wide screens: a discovery card, the mission that
 * arrives with a match, and a correction — the three ideas the copy describes.
 * Pure markup on the design tokens, so it follows light and dark mode and
 * costs no image download.
 */
export function HeroPreview({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative mx-auto w-full max-w-[22rem]">
        <div className="animate-fade absolute inset-x-5 -bottom-4 top-8 -rotate-6 rounded-[var(--radius-card)] bg-brand-soft shadow-[0_0_0_0.5px_var(--separator)]" />

        <div className="animate-materialize relative overflow-hidden rounded-[var(--radius-card)] bg-raised shadow-[0_0_0_0.5px_var(--separator),0_30px_70px_-30px_rgb(0_0_0/0.45)]">
          <div className="relative aspect-[5/4] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%),linear-gradient(140deg,var(--brand),#8b5cf6_60%,var(--accent))]">
            <span className="absolute inset-0 flex items-center justify-center text-[7rem] font-bold text-white/25">
              L
            </span>
            <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.3)] backdrop-blur-xl">
              🇩🇪 Learning German
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-xs">B1</span>
            </span>
          </div>
          <div className="space-y-2.5 p-5">
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink">Lucía, 26</p>
              <p className="text-sm text-muted">Sevilla, Spain 🇪🇸</p>
            </div>
            <p className="text-sm text-ink">
              <span className="text-muted">Speaks</span>{" "}
              <span className="font-semibold">🇪🇸 Spanish</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                Language Buddy
              </span>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                Cultural Exchange
              </span>
            </div>
          </div>
        </div>

        <div className="material-float animate-pop absolute -right-10 bottom-10 w-56 rotate-3 rounded-2xl p-4 [animation-delay:0.35s] xl:-right-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
            Today&apos;s mission
          </p>
          <p className="mt-1 text-sm font-bold leading-snug text-ink">
            Swap your favourite film recommendations
          </p>
          <p className="mt-1.5 text-xs font-semibold text-accent-ink">+10 XP each</p>
        </div>

        <div className="animate-pop absolute -left-12 top-16 w-52 -rotate-2 rounded-2xl bg-positive-soft px-3.5 py-2.5 shadow-[0_0_0_0.5px_color-mix(in_oklab,var(--positive)_30%,transparent),var(--shadow-float)] [animation-delay:0.5s] xl:-left-20">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-positive">
            Correction
          </p>
          <p className="mt-1 text-sm text-muted line-through decoration-negative/60">
            I goed to the museum
          </p>
          <p className="text-sm font-medium text-ink">I went to the museum</p>
        </div>
      </div>
    </div>
  );
}
