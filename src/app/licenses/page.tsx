import type { Metadata } from "next";
import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Licenses & attributions" };

type Attribution = {
  id: string;
  name: string;
  source_type: "editorial" | "dataset" | "reference_data";
  source_url: string | null;
  license: string;
  license_url: string | null;
  author: string | null;
  attribution_text: string;
  requires_item_attribution: boolean;
  item_counts: Record<string, number>;
  contributors: string[] | null;
};

const LANGUAGE_NAMES: Record<string, string> = {
  de: "German", es: "Spanish", nl: "Dutch", tr: "Turkish", en: "English",
};

/**
 * Public, so it can be linked from anywhere (and read signed out). The list is
 * the content_sources table itself, so a new dataset appears here the moment
 * its first rows are imported — attribution is data, not a code comment.
 */
export default async function LicensesPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_content_attributions");
  const sources = (data ?? []) as Attribution[];

  return (
    <main className="safe-top mx-auto w-full max-w-2xl px-gutter pb-16 pt-6 md:pt-10">
      <Link
        href="/profile/settings"
        className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-muted hover:bg-sunken hover:text-ink"
      >
        <BackIcon className="size-4" /> Back
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Licenses &amp; attributions
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The words and sentences in {APP_NAME} lessons come from the sources
        below. Everything is stored and served by {APP_NAME} itself — lessons
        never call these projects while you learn. Listening exercises use your
        device&rsquo;s own speech voices; no recordings are taken from these
        sources.
      </p>

      <ul className="mt-8 space-y-4">
        {sources.map((s) => {
          const counts = Object.entries(s.item_counts ?? {});
          const total = counts.reduce((n, [, c]) => n + c, 0);
          return (
            <li key={s.id} className="rounded-3xl border border-line bg-raised p-5 md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-base font-bold text-ink">
                  {s.source_url ? (
                    <a href={s.source_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </h2>
                <p className="text-xs font-semibold text-brand">
                  {s.license_url ? (
                    <a href={s.license_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {s.license}
                    </a>
                  ) : (
                    s.license
                  )}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.attribution_text}</p>
              <p className="mt-3 text-xs text-faint">
                {total > 0
                  ? `${total} texts in lessons — ${counts
                      .map(([lang, n]) => `${LANGUAGE_NAMES[lang] ?? lang} ${n}`)
                      .join(", ")}`
                  : "No texts from this source are in lessons yet."}
              </p>
              {s.requires_item_attribution && s.contributors && s.contributors.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-ink">
                    Contributors ({s.contributors.length})
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {s.contributors.join(", ")}. Each sentence is also credited
                    individually when it appears in a lesson.
                  </p>
                </details>
              )}
            </li>
          );
        })}
      </ul>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-sm font-semibold text-ink">Unicode License v3 notice</h2>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted">
          {`Copyright © 1991-2025 Unicode, Inc. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of data files and any associated documentation (the "Data Files") or software and any associated documentation (the "Software") to deal in the Data Files or Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, and/or sell copies of the Data Files or Software, and to permit persons to whom the Data Files or Software are furnished to do so, provided that either (a) this copyright and permission notice appear with all copies of the Data Files or Software, or (b) this copyright and permission notice appear in associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF THIRD PARTY RIGHTS. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES, OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall not be used in advertising or otherwise to promote the sale, use or other dealings in these Data Files or Software without prior written authorization of the copyright holder.`}
        </p>
      </section>
    </main>
  );
}
