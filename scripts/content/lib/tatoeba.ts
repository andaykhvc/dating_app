/**
 * Tatoeba -> candidate concepts, as pure functions so they can be tested
 * without the real (large) exports. The CLI is scripts/content/import-tatoeba.ts.
 *
 * Licence (verified 2026-09-27 against Tatoeba's own source and Terms of Use):
 * sentence text is CC BY 2.0 FR, except the CC0 1.0 subset listed in
 * `*_sentences_CC0`. Commercial use and modification are allowed; each
 * sentence must be credited to its contributor. Audio is licensed per speaker
 * and is never imported.
 *
 * Pipeline: pivot on English. For each English sentence, take one directly
 * linked translation per target language, filter every text for learner
 * quality, estimate a CEFR level from how much of it our curriculum already
 * teaches, map it to the skill whose vocabulary it uses most, and emit it as
 * `needs_review` so a human approves it before any learner sees it.
 */
import { fold, norm, tokenize } from "./text.ts";
import type { Model } from "./model.ts";

/** Tatoeba's ISO 639-3 codes for our languages. */
export const TATOEBA_CODES: Record<string, string> = {
  en: "eng", de: "deu", es: "spa", nl: "nld", tr: "tur",
  fr: "fra", it: "ita", pt: "por",
};

export type TatoebaSentence = {
  id: string;
  lang: string;
  text: string;
  author: string | null;
  license: "CC BY 2.0 FR" | "CC0 1.0";
};

export type RejectReason =
  | "too-long" | "punctuation" | "capital" | "markup" | "blocklisted"
  | "names" | "multi-sentence" | "digits" | "es-question" | "duplicate";

/**
 * Tatoeba is famous for "Tom" and "Mary". They are fine sentences, but an
 * app full of strangers named Tom reads oddly, so they are filtered unless
 * --allow-names is passed.
 */
const STOCK_NAMES = new Set(["tom", "mary", "john", "alice", "bob", "ken", "jim", "jane", "maria", "sami", "layla", "mennad", "baya", "yanni", "ziri", "rima", "skura"]);

export function rejectReason(
  s: TatoebaSentence,
  opts: { maxTokens: number; maxChars: number; blocklist: string[]; allowNames: boolean },
): RejectReason | null {
  const t = s.text;
  const { bare } = tokenize(t);
  if (t.length > opts.maxChars || bare.length > opts.maxTokens || bare.length < 2) return "too-long";
  if (!/[.!?]$/.test(t)) return "punctuation";
  const first = t.replace(/^[¿¡"]+/, "")[0] ?? "";
  if (first !== first.toUpperCase() || first === first.toLowerCase()) return "capital";
  if (/[[\](){}<>«»"“”_#*@/\\]|https?:/.test(t)) return "markup";
  if (/[.!?]\s+\S/.test(t)) return "multi-sentence";
  if (/\d/.test(t)) return "digits";
  if (s.lang === "es" && t.endsWith("?") && !t.includes("¿")) return "es-question";
  const words = new Set(bare.map(norm));
  if (opts.blocklist.some((b) => words.has(norm(b)))) return "blocklisted";
  if (!opts.allowNames && bare.some((w) => STOCK_NAMES.has(norm(w)))) return "names";
  return null;
}

/** Per language: folded forms our curriculum already teaches, by skill. */
export type Lexicon = { all: Set<string>; bySkill: Map<string, Set<string>> };

export function buildLexicon(model: Model): Record<string, Lexicon> {
  const out: Record<string, Lexicon> = {};
  for (const [key, byLang] of model.translations) {
    const concept = model.concepts.get(key);
    if (!concept) continue;
    for (const t of byLang.values()) {
      const lex = (out[t.lang] ??= { all: new Set(), bySkill: new Map() });
      let skillSet = lex.bySkill.get(concept.skill);
      if (!skillSet) lex.bySkill.set(concept.skill, (skillSet = new Set()));
      for (const tok of [...t.tokens, ...t.alternatives.flatMap((a) => tokenize(a).bare)]) {
        const f = fold(tok);
        lex.all.add(f);
        // Only content words say what a sentence is about.
        if (concept.kind === "word" && f.length > 2) skillSet.add(f);
      }
    }
  }
  return out;
}

/** Share of a sentence's words the curriculum already teaches (0..1). */
export function coverage(text: string, lex: Lexicon | undefined): number {
  const toks = tokenize(text).bare.map(fold);
  if (!lex || toks.length === 0) return 0;
  return toks.filter((t) => lex.all.has(t)).length / toks.length;
}

/**
 * Deterministic CEFR approximation — not an assessment. Short sentences built
 * from words the course already teaches are A1; slightly longer ones with a
 * few unknown words are A2; anything else is out of scope for now. Editors
 * can override the level in the generated file.
 */
export function estimateCefr(maxTokens: number, minCoverage: number): "A1" | "A2" | null {
  if (maxTokens <= 7 && minCoverage >= 0.75) return "A1";
  if (maxTokens <= 10 && minCoverage >= 0.6) return "A2";
  return null;
}

export function bestSkill(texts: { lang: string; text: string }[], lexicons: Record<string, Lexicon>): string | null {
  const score = new Map<string, number>();
  for (const { lang, text } of texts) {
    const lex = lexicons[lang];
    if (!lex) continue;
    const toks = tokenize(text).bare.map(fold);
    for (const [skill, words] of lex.bySkill) {
      const hits = toks.filter((t) => words.has(t)).length;
      if (hits) score.set(skill, (score.get(skill) ?? 0) + hits);
    }
  }
  let best: string | null = null;
  let top = 0;
  for (const [skill, s] of score) if (s > top) [best, top] = [skill, s];
  return top >= 2 ? best : null;
}

export type Candidate = {
  key: string;
  english: TatoebaSentence;
  translations: TatoebaSentence[];
  cefr: "A1" | "A2";
  skill: string;
  coverage: number;
};

export function buildCandidates(input: {
  english: Map<string, TatoebaSentence>;
  /** lang -> id -> sentence (already filtered) */
  targets: Record<string, Map<string, TatoebaSentence>>;
  /** lang -> english id -> linked target ids */
  links: Record<string, Map<string, string[]>>;
  lexicons: Record<string, Lexicon>;
  requiredLangs: string[];
  existingFolds: Record<string, Set<string>>;
}): { candidates: Candidate[]; rejected: Record<string, number> } {
  const rejected: Record<string, number> = {};
  const bump = (r: string) => (rejected[r] = (rejected[r] ?? 0) + 1);
  const seen: Record<string, Set<string>> = {};
  const candidates: Candidate[] = [];

  for (const [engId, eng] of input.english) {
    const translations: TatoebaSentence[] = [];
    for (const lang of input.requiredLangs) {
      const ids = input.links[lang]?.get(engId) ?? [];
      // Shortest linked translation: usually the plainest one.
      const options = ids
        .map((id) => input.targets[lang]?.get(id))
        .filter((s): s is TatoebaSentence => Boolean(s))
        .sort((a, b) => a.text.length - b.text.length);
      if (options[0]) translations.push(options[0]);
    }
    if (translations.length < input.requiredLangs.length) {
      bump("missing-translation");
      continue;
    }

    const all = [eng, ...translations];
    // Never import a sentence we (or an earlier import) already have.
    if (all.some((s) => input.existingFolds[s.lang]?.has(fold(s.text)) || seen[s.lang]?.has(fold(s.text)))) {
      bump("duplicate");
      continue;
    }

    const maxTokens = Math.max(...all.map((s) => tokenize(s.text).bare.length));
    const covs = all.map((s) => coverage(s.text, input.lexicons[s.lang]));
    const minCov = Math.min(...covs);
    const cefr = estimateCefr(maxTokens, minCov);
    if (!cefr) {
      bump("beyond-a2");
      continue;
    }
    const skill = bestSkill(all, input.lexicons);
    if (!skill) {
      bump("no-topic");
      continue;
    }

    for (const s of all) (seen[s.lang] ??= new Set()).add(fold(s.text));
    candidates.push({
      key: `tatoeba-${engId}`,
      english: eng,
      translations,
      cefr,
      skill,
      coverage: covs.reduce((a, b) => a + b, 0) / covs.length,
    });
  }

  candidates.sort((a, b) => b.coverage - a.coverage || a.key.localeCompare(b.key));
  return { candidates, rejected };
}

/** Parses `sentences_detailed` rows: id, lang, text, username, added, modified. */
export function parseDetailed(content: string, lang: string, cc0: Set<string>): TatoebaSentence[] {
  const out: TatoebaSentence[] = [];
  for (const line of content.split("\n")) {
    if (!line) continue;
    const [id, , text, username] = line.split("\t");
    if (!id || !text) continue;
    out.push({
      id,
      lang,
      text: text.trim(),
      author: username && username !== "\\N" ? username : null,
      license: cc0.has(id) ? "CC0 1.0" : "CC BY 2.0 FR",
    });
  }
  return out;
}

export function parseIds(content: string): Set<string> {
  return new Set(content.split("\n").map((l) => l.split("\t")[0]).filter(Boolean));
}

/** `{a}-{b}_links.tsv`: sentence_id \t translation_id. Keyed by the English side. */
export function parseLinks(content: string, englishIds: Set<string>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const line of content.split("\n")) {
    const [a, b] = line.split("\t");
    if (!a || !b) continue;
    const [eng, other] = englishIds.has(a) ? [a, b] : englishIds.has(b) ? [b, a] : [null, null];
    if (!eng || !other) continue;
    out.set(eng, [...(out.get(eng) ?? []), other.trim()]);
  }
  return out;
}

function clean(text: string) {
  return text.replace(/\t/g, " ").trim();
}

/** Rows in the formats content/concepts/*.tsv and content/<lang>/*.tsv expect. */
export function toTsv(candidates: Candidate[], status: "needs_review" | "active") {
  const header = (lines: string[]) => [
    "# GENERATED by scripts/content/import-tatoeba.ts — review, then change status to active.",
    "# Sentences from Tatoeba (https://tatoeba.org), CC BY 2.0 FR unless marked CC0 1.0, credited per row.",
    "#source: tatoeba",
    ...lines,
  ];
  const concepts = header(["key\tkind\tpos\tcefr\tskill\ttopic\tsituation\tflags"]);
  const perLang: Record<string, string[]> = {};
  for (const c of candidates) {
    // The flags cell is "a=b; c" syntax, so the gloss must not carry ; or =.
    const gloss = clean(c.english.text).replace(/[;=]/g, ",");
    concepts.push([c.key, "s", "", c.cefr, c.skill, "", "", `gloss=${gloss}; status=${status}`].join("\t"));
    for (const s of [c.english, ...c.translations]) {
      const code = Object.entries(TATOEBA_CODES).find(([, v]) => v === s.lang)?.[0] ?? s.lang;
      (perLang[code] ??= header(["key\ttext\text_id\tauthor\tlicense\tstatus"])).push(
        [c.key, clean(s.text), s.id, s.author ?? "Tatoeba contributors", s.license, status].join("\t"),
      );
    }
  }
  return { concepts: concepts.join("\n") + "\n", perLang: Object.fromEntries(Object.entries(perLang).map(([k, v]) => [k, v.join("\n") + "\n"])) };
}
