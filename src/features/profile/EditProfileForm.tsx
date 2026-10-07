"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SelectableChip } from "@/components/ui/Chip";
import { TopBar } from "@/components/layout/TopBar";
import { PhotoManager, type StoredPhoto } from "@/features/profile/PhotoManager";
import { IntentionPicker } from "@/features/profile/IntentionPicker";
import { AgeRangeSlider } from "@/features/profile/AgeRangeSlider";
import { CountryPicker } from "@/features/profile/CountryPicker";
import { createClient } from "@/lib/supabase/client";
import { saveInterests, saveLanguages } from "@/features/profile/saveLists";
import { CEFR_DESCRIPTIONS, COUNTRIES } from "@/lib/constants";
import {
  CEFR_LEVELS,
  type CefrLevel,
  type Intention,
  type Interest,
  type Language,
} from "@/types/domain";

type Initial = {
  firstName: string;
  city: string;
  countryCode: string;
  bio: string;
  intentions: Intention[];
  ageMin: number;
  ageMax: number;
  countries: string[];
  hideDating: boolean;
  native: string;
  learning: string;
  level: CefrLevel;
  photos: StoredPhoto[];
  interestIds: number[];
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-raised p-5 md:p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EditProfileForm({
  userId,
  languages,
  interests,
  initial,
}: {
  userId: string;
  languages: Language[];
  interests: Interest[];
  initial: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Save can be pressed from the header, far from where the error renders.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error]);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setError(null);
    if (form.native === form.learning) {
      setError("Pick a different language to learn than the one you speak.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: form.firstName.trim(),
        city: form.city.trim() || null,
        country_code: form.countryCode,
        bio: form.bio.trim() || null,
        intentions: form.intentions,
        preferred_age_min: form.ageMin,
        preferred_age_max: form.ageMax,
        preferred_countries: form.countries,
        hide_dating_profiles: form.hideDating,
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    const listError =
      (await saveLanguages(supabase, userId, {
        native: form.native,
        learning: form.learning,
        level: form.level,
      })) ?? (await saveInterests(supabase, userId, form.interestIds));

    if (listError) {
      setError(listError);
      setSaving(false);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  const languageOptions = (
    <>
      <optgroup label="Available now">
        {languages
          .filter((l) => l.is_launch_language)
          .map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag_emoji} {l.name}
            </option>
          ))}
      </optgroup>
      <optgroup label="More languages">
        {languages
          .filter((l) => !l.is_launch_language)
          .map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag_emoji} {l.name}
            </option>
          ))}
      </optgroup>
    </>
  );

  return (
    <>
      {/* Save sits in the header as well as at the end, so a long form never
          needs scrolling back down to commit a one-field change. */}
      <TopBar
        title="Edit profile"
        width="wide"
        leading={
          <Link
            href="/profile"
            aria-label="Back to profile"
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken"
          >
            <BackIcon className="size-5" />
          </Link>
        }
        action={
          <Button onClick={save} loading={saving} className="h-10 px-4">
            Save
          </Button>
        }
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-gutter py-5 md:py-8 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="space-y-4 lg:space-y-6">
          <Section title="Photos">
            <PhotoManager
              userId={userId}
              photos={form.photos}
              onChange={(photos) => set("photos", photos)}
            />
          </Section>

          <Section title="About you">
            <div className="space-y-4">
              <Field label="First name">
                <Input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  maxLength={40}
                />
              </Field>
              <Field label="Country">
                <Select
                  value={form.countryCode}
                  onChange={(e) => set("countryCode", e.target.value)}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="City" hint="Optional.">
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label="Your line">
                <Textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value.slice(0, 300))}
                  rows={3}
                />
              </Field>
            </div>
          </Section>

          <Section title="Languages">
            <div className="space-y-4">
              <Field label="I speak natively">
                <Select
                  value={form.native}
                  onChange={(e) => set("native", e.target.value)}
                >
                  <option value="">Select a language</option>
                  {languageOptions}
                </Select>
              </Field>
              <Field label="I want to learn">
                <Select
                  value={form.learning}
                  onChange={(e) => set("learning", e.target.value)}
                >
                  <option value="">Select a language</option>
                  {languageOptions}
                </Select>
              </Field>
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">
                  My level
                </span>
                <div className="flex flex-wrap gap-2">
                  {CEFR_LEVELS.map((l) => (
                    <SelectableChip
                      key={l}
                      selected={form.level === l}
                      onClick={() => set("level", l)}
                    >
                      {l}
                    </SelectableChip>
                  ))}
                </div>
                <p className="mt-2 text-xs text-faint">
                  {CEFR_DESCRIPTIONS[form.level]}
                </p>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Section title="Interests">
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => {
                const selected = form.interestIds.includes(interest.id);
                return (
                  <SelectableChip
                    key={interest.id}
                    selected={selected}
                    onClick={() =>
                      set(
                        "interestIds",
                        selected
                          ? form.interestIds.filter((id) => id !== interest.id)
                          : form.interestIds.length >= 8
                            ? form.interestIds
                            : [...form.interestIds, interest.id],
                      )
                    }
                  >
                    {interest.emoji} {interest.label}
                  </SelectableChip>
                );
              })}
            </div>
          </Section>

          <Section title="Here for">
            <IntentionPicker
              value={form.intentions}
              onChange={(v) => set("intentions", v)}
            />
          </Section>

          <Section title="Who you meet">
            <div className="space-y-6">
              <AgeRangeSlider
                min={form.ageMin}
                max={form.ageMax}
                onChange={(lo, hi) =>
                  setForm((prev) => ({ ...prev, ageMin: lo, ageMax: hi }))
                }
              />
              <div>
                <span className="mb-3 block text-sm font-semibold text-ink">
                  Countries
                </span>
                <CountryPicker
                  value={form.countries}
                  onChange={(v) => set("countries", v)}
                />
              </div>
              <label className="flex items-start gap-3 rounded-2xl bg-sunken p-4">
                <input
                  type="checkbox"
                  checked={form.hideDating}
                  onChange={(e) => set("hideDating", e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    Language partners only
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Hides everyone open to dating from Discover.
                  </span>
                </span>
              </label>
            </div>
          </Section>
        </div>

        {error && (
          <p
            ref={errorRef}
            role="alert"
            className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative lg:col-span-2"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pb-4 lg:col-span-2 lg:ml-auto lg:w-full lg:max-w-sm">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push("/profile")}
          >
            Cancel
          </Button>
          <Button fullWidth onClick={save} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  );
}
