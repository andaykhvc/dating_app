/**
 * Content quality rules. Errors block a build; warnings are printed and
 * shipped. Every rule is deterministic and cheap: no AI, no network.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CEFR, POS, type Issue, type Model, type Translation } from "./model.ts";
import { fold, norm } from "./text.ts";

/** Hard limits per CEFR level for sentences. Deliberately conservative. */
export const LIMITS = {
  A1: { maxTokens: 9, maxChars: 60 },
  A2: { maxTokens: 12, maxChars: 90 },
  B1: { maxTokens: 16, maxChars: 120 },
  word: { maxTokens: 4, maxChars: 40 },
} as const;

/**
 * Words that must never appear in learner content. Short on purpose: it is a
 * tripwire for bulk imports (Tatoeba allows vulgar sentences), not a
 * moderation system. Extend content/blocklist.json per language.
 */
export function loadBlocklist(model: Model): Record<string, string[]> {
  const path = join(model.root, "blocklist.json");
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string[]>;
}

export function validate(model: Model, blocklist: Record<string, string[]> = {}): Issue[] {
  const issues: Issue[] = [...model.issues];
  const err = (code: string, message: string, where?: string) => issues.push({ level: "error", code, message, where });
  const warn = (code: string, message: string, where?: string) => issues.push({ level: "warning", code, message, where });

  const langs = Object.keys(model.languages);
  const sourceIds = new Set(model.sources.map((s) => s.id));
  const enabledSources = new Set(model.sources.filter((s) => s.is_enabled).map((s) => s.id));
  const skills = new Set(model.curriculum.units.flatMap((u) => u.skills.map((s) => s.key)));

  // Sources: the licensing rule the database also enforces.
  for (const s of model.sources) {
    if (s.is_enabled && (!s.commercial_use_allowed || !s.modification_allowed || s.share_alike)) {
      err("unusable-license", `Source "${s.id}" is enabled but its licence forbids commercial use, modification, or imposes share-alike`);
    }
    if (s.requires_item_attribution && !s.item_url_template) {
      warn("no-item-url", `Source "${s.id}" needs per-item attribution but has no item_url_template`);
    }
  }

  // Curriculum integrity.
  const keys = new Set<string>();
  for (const u of model.curriculum.units) {
    if (keys.has(u.key)) err("duplicate-key", `Unit key "${u.key}" reused`);
    keys.add(u.key);
    if (!CEFR.includes(u.cefr)) err("bad-cefr", `Unit "${u.key}" has CEFR "${u.cefr}"`);
    for (const s of u.skills) {
      if (keys.has(s.key)) err("duplicate-key", `Skill key "${s.key}" reused`);
      keys.add(s.key);
    }
  }
  for (const c of model.curriculum.courses) {
    if (!langs.includes(c.language)) err("bad-language", `Course for unknown language "${c.language}"`);
  }

  for (const c of model.concepts.values()) {
    const where = `${c.file}:${c.line}`;
    if (!/^[a-z0-9][a-z0-9_.-]*$/.test(c.key)) err("bad-key", `Concept key "${c.key}" must be lower-case a-z, 0-9, _ . -`, where);
    if (!skills.has(c.skill)) err("unknown-skill", `Concept "${c.key}" names unknown skill "${c.skill}"`, where);
    if (!CEFR.includes(c.cefr)) err("bad-cefr", `Concept "${c.key}" has CEFR "${c.cefr}"`, where);
    if (c.cefr !== "A1" && c.cefr !== "A2" && c.cefr !== "B1") warn("beyond-b1", `Concept "${c.key}" is ${c.cefr}; this course targets A1–B1`, where);
    if (c.pos && !(POS as readonly string[]).includes(c.pos)) err("bad-pos", `Concept "${c.key}" has part of speech "${c.pos}"`, where);
    if (c.kind === "word" && !c.pos) err("missing-pos", `Word "${c.key}" needs a part of speech (distractors depend on it)`, where);
    if (!sourceIds.has(c.source)) err("unknown-source", `Concept "${c.key}" cites unknown source "${c.source}"`, where);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(c.topic)) err("bad-topic", `Concept "${c.key}" has topic "${c.topic}"`, where);

    const byLang = model.translations.get(c.key);
    for (const lang of langs) {
      if (!byLang?.get(lang)) {
        const level = model.languages[lang].core && c.source === "lingua-match-editorial" ? "error" : "warning";
        issues.push({ level, code: "missing-translation", message: `"${c.key}" has no ${lang} text`, where });
      }
    }
  }

  // Per-language texts.
  const seenText = new Map<string, string>();
  for (const [key, byLang] of model.translations) {
    const c = model.concepts.get(key);
    for (const t of byLang.values()) {
      const where = `${t.file}:${t.line}`;
      if (!c) {
        err("unknown-concept", `Translation for unknown concept "${key}"`, where);
        continue;
      }
      if (!langs.includes(t.lang)) err("bad-language", `Unsupported language "${t.lang}"`, where);
      if (!sourceIds.has(t.source)) err("unknown-source", `"${key}" [${t.lang}] cites unknown source "${t.source}"`, where);
      else if (!enabledSources.has(t.source) && t.status === "active") {
        err("disabled-source", `"${key}" [${t.lang}] is active but its source "${t.source}" is disabled`, where);
      }
      checkText(t, c.kind, c.cefr, c.proper ? "proper-noun" : c.pos, err, warn, model, blocklist);

      // Two different sentences must not read the same.
      const id = `${t.lang}|${c.kind}|${fold(t.text)}`;
      const other = seenText.get(id);
      if (other && other !== key && c.kind === "sentence") {
        err("duplicate-text", `"${key}" and "${other}" are the same ${t.lang} sentence`, where);
      }
      seenText.set(id, key);
    }
  }

  return issues;
}

function checkText(
  t: Translation,
  kind: string,
  cefr: string,
  pos: string | null,
  err: (c: string, m: string, w?: string) => void,
  warn: (c: string, m: string, w?: string) => void,
  model: Model,
  blocklist: Record<string, string[]>,
) {
  const where = `${t.file}:${t.line}`;
  const label = `"${t.key}" [${t.lang}]`;
  const text = t.text;

  if (!text) return err("empty-text", `${label} is empty`, where);
  if (/[\u0000-\u001f\u007f]/.test(text)) err("control-char", `${label} contains control characters`, where);
  if (/\s{2,}|^\s|\s$/.test(text)) err("whitespace", `${label} has stray whitespace`, where);
  if (/[[\]{}<>]|https?:|@/.test(text)) err("markup", `${label} contains brackets, markup or a link`, where);
  if (t.tokens.some((tok) => tok.length === 0)) err("punct-token", `${label} has a token that is only punctuation`, where);

  // norm(), not fold(): in Turkish "sık" (often) and "sik" are different words.
  const words = new Set(t.tokens.map(norm));
  for (const bad of blocklist[t.lang] ?? []) {
    if (words.has(norm(bad))) err("blocklisted", `${label} contains a blocked word`, where);
  }

  if (kind === "sentence") {
    const limit = cefr === "A1" ? LIMITS.A1 : cefr === "A2" ? LIMITS.A2 : LIMITS.B1;
    if (t.tokens.length > limit.maxTokens) err("too-long", `${label} has ${t.tokens.length} words (max ${limit.maxTokens} at ${cefr})`, where);
    if (text.length > limit.maxChars) err("too-long", `${label} has ${text.length} characters (max ${limit.maxChars} at ${cefr})`, where);
    if (!/[.!?…]["»)]?$/.test(text)) err("no-final-punctuation", `${label} must end with . ! or ?`, where);
    const first = text.replace(/^[¿¡"«(]+/, "")[0] ?? "";
    if (first !== first.toUpperCase()) err("lowercase-start", `${label} must start with a capital letter`, where);
    if (t.lang === "es" && /\?$/.test(text) && !text.includes("¿")) err("es-question-mark", `${label} is a question without ¿`, where);
    if (t.lang === "es" && /!$/.test(text) && !text.includes("¡")) warn("es-exclamation-mark", `${label} is an exclamation without ¡`, where);
    if (t.tokens.length < 3) warn("short-sentence", `${label} is too short for word-order exercises`, where);
  } else if (kind === "word") {
    if (t.tokens.length > LIMITS.word.maxTokens || text.length > LIMITS.word.maxChars) {
      err("too-long", `${label} is long for a vocabulary item`, where);
    }
  }

  if (t.focus && t.clozeIndex === null) err("bad-focus", `${label}: gap word "${t.focus}" is not a word of the sentence`, where);
  if (t.clozePos === "other") warn("gap-pos", `${label}: part of speech of gap "${t.focus}" unknown; add [${t.focus}:pos]`, where);

  const articles = model.languages[t.lang]?.nounArticles ?? {};
  if (kind === "word" && pos === "noun" && Object.keys(articles).length > 0) {
    const first = t.text.split(" ")[0].toLowerCase();
    if (!(first in articles) && !t.gender) warn("noun-article", `${label} is a noun without an article`, where);
  }
  if (t.lang === "de" && kind === "word" && pos === "noun") {
    const noun = t.text.split(" ").slice(-1)[0];
    if (noun && noun[0] !== noun[0].toUpperCase()) err("de-noun-case", `${label}: German nouns are capitalised`, where);
  }
  if (t.source !== "lingua-match-editorial" && t.source !== "unicode-cldr" && !t.externalId) {
    err("no-provenance", `${label} is imported but has no source id (ext_id)`, where);
  }
}

export function summarize(issues: Issue[]) {
  return {
    errors: issues.filter((i) => i.level === "error"),
    warnings: issues.filter((i) => i.level === "warning"),
  };
}
