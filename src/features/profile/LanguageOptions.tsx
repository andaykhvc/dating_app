import type { Language } from "@/types/domain";

/**
 * The <option> groups for a language picker, shared by onboarding and the
 * profile editor so both say the same thing.
 *
 * "Fully supported" languages have a course. The rest are "Coming soon": they
 * can still be chosen as the language someone *speaks* (it helps matching) but
 * not as the one they want to *learn*, because there is nothing to learn from
 * yet. The database enforces the same rule (99997_language_support.sql).
 */
export function LanguageOptions({
  languages,
  forLearning,
}: {
  languages: Language[];
  forLearning: boolean;
}) {
  const supported = languages.filter((l) => l.is_launch_language);
  const comingSoon = languages.filter((l) => !l.is_launch_language);

  return (
    <>
      <optgroup label="Fully supported">
        {supported.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag_emoji} {l.name}
          </option>
        ))}
      </optgroup>
      {comingSoon.length > 0 && (
        <optgroup label="Coming soon">
          {comingSoon.map((l) => (
            <option key={l.code} value={l.code} disabled={forLearning}>
              {l.flag_emoji} {l.name} · {forLearning ? "coming soon" : "matching only"}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

/** Message for a learning language we have no course for, else null. */
export function unsupportedLearningMessage(
  languages: Language[],
  code: string,
): string | null {
  const language = languages.find((l) => l.code === code);
  return language && !language.is_launch_language
    ? `${language.name} is coming soon. Pick a fully supported language to learn.`
    : null;
}
