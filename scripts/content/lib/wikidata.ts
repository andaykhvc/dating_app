/**
 * Wikidata Lexemes (CC0 1.0) as a *checking* and *suggestion* source.
 *
 * What we take: lemmas, lexical category, grammatical gender (P5185) and the
 * language-neutral item a sense denotes (P5137 "item for this sense"). What we
 * never take: sense glosses or usage examples, which contributors sometimes
 * copy from dictionaries despite the CC0 label.
 *
 * Input is the weekly lexeme dump (one JSON entity per line), never the live
 * query service at runtime.
 */
import { fold } from "./text.ts";
import type { Model } from "./model.ts";

/** Wikidata items for our languages (lexeme "language" field). */
export const LANGUAGE_ITEMS: Record<string, string> = {
  Q1860: "en", Q188: "de", Q1321: "es", Q7411: "nl", Q256: "tr",
};
const CATEGORY_ITEMS: Record<string, string> = {
  Q1084: "noun", Q24905: "verb", Q34698: "adjective", Q380057: "adverb",
};
const GENDER_ITEMS: Record<string, string> = {
  Q499327: "m", Q1775415: "f", Q1775461: "n", Q1305037: "c",
};

export type Lexeme = {
  id: string;
  lang: string;
  lemma: string;
  pos: string | null;
  gender: string | null;
  /** Items (Q-ids) its senses denote. */
  items: string[];
};

type RawLexeme = {
  id?: string;
  type?: string;
  language?: string;
  lexicalCategory?: string;
  lemmas?: Record<string, { value: string }>;
  claims?: Record<string, { mainsnak?: { datavalue?: { value?: { id?: string } } } }[]>;
  senses?: { claims?: Record<string, { mainsnak?: { datavalue?: { value?: { id?: string } } } }[]> }[];
};

const claimIds = (claims: RawLexeme["claims"], prop: string) =>
  (claims?.[prop] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter((x): x is string => Boolean(x));

/** One dump line ("{...}," inside a JSON array) -> Lexeme, or null if irrelevant. */
export function parseDumpLine(line: string): Lexeme | null {
  const trimmed = line.trim().replace(/,$/, "");
  if (!trimmed.startsWith("{")) return null;
  let raw: RawLexeme;
  try {
    raw = JSON.parse(trimmed) as RawLexeme;
  } catch {
    return null;
  }
  const lang = raw.language ? LANGUAGE_ITEMS[raw.language] : undefined;
  if (!lang || !raw.id || !raw.lemmas) return null;
  const lemma = Object.values(raw.lemmas)[0]?.value;
  if (!lemma) return null;
  return {
    id: raw.id,
    lang,
    lemma,
    pos: raw.lexicalCategory ? CATEGORY_ITEMS[raw.lexicalCategory] ?? null : null,
    gender: claimIds(raw.claims, "P5185").map((g) => GENDER_ITEMS[g]).find(Boolean) ?? null,
    items: (raw.senses ?? []).flatMap((s) => claimIds(s.claims, "P5137")),
  };
}

export type GenderIssue = { key: string; lang: string; text: string; ours: string; wikidata: string; lexeme: string };
export type Suggestion = { key: string; lang: string; current: string | null; suggestion: string; lexemes: string };

/**
 * Compares our nouns' genders with Wikidata and proposes translations for
 * missing cells, by following English lemma -> sense item -> other-language
 * lexemes denoting the same item.
 */
export function analyse(model: Model, lexemes: Lexeme[]) {
  const byLemma = new Map<string, Lexeme[]>();
  const byItem = new Map<string, Lexeme[]>();
  for (const l of lexemes) {
    const k = `${l.lang}|${fold(l.lemma)}`;
    byLemma.set(k, [...(byLemma.get(k) ?? []), l]);
    for (const item of l.items) byItem.set(item, [...(byItem.get(item) ?? []), l]);
  }

  const genderIssues: GenderIssue[] = [];
  const suggestions: Suggestion[] = [];
  const langs = Object.keys(model.languages);

  for (const [key, byLang] of model.translations) {
    const concept = model.concepts.get(key);
    if (!concept || concept.kind !== "word") continue;

    for (const t of byLang.values()) {
      if (concept.pos !== "noun" || !t.gender) continue;
      const bare = t.alternatives[t.alternatives.length - 1] ?? t.text;
      const match = (byLemma.get(`${t.lang}|${fold(bare)}`) ?? []).find((l) => l.pos === "noun" && l.gender);
      if (match && match.gender !== t.gender && !(t.gender === "c" && match.gender !== "n")) {
        genderIssues.push({ key, lang: t.lang, text: t.text, ours: t.gender, wikidata: match.gender!, lexeme: match.id });
      }
    }

    const en = byLang.get("en");
    if (!en) continue;
    const enLexemes = (byLemma.get(`en|${fold(en.text.replace(/^to /, ""))}`) ?? [])
      .filter((l) => !concept.pos || !l.pos || l.pos === concept.pos);
    const items = new Set(enLexemes.flatMap((l) => l.items));
    if (items.size === 0) continue;

    for (const lang of langs) {
      if (lang === "en" || byLang.has(lang)) continue;
      const found = [...items].flatMap((i) => byItem.get(i) ?? []).filter((l) => l.lang === lang);
      if (found.length === 0) continue;
      const lemmas = [...new Set(found.map((l) => l.lemma))];
      suggestions.push({
        key, lang, current: null,
        suggestion: lemmas.slice(0, 3).join(" | "),
        lexemes: [...new Set(found.map((l) => l.id))].slice(0, 5).join(" "),
      });
    }
  }
  return { genderIssues, suggestions };
}
