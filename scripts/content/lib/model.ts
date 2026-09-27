/**
 * Loads everything under content/ into one in-memory model.
 *
 *   content/languages.json       languages with a course or used as a base
 *   content/sources.json         provenance registry (-> content_sources)
 *   content/curriculum.json      courses, units, skills
 *   content/concepts/*.tsv       concepts, optionally with one column per language
 *   content/<lang>/*.tsv         per-language rows (imports, new languages)
 *
 * Files are the source of truth; the database is a build artifact of them.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseCell, tokenize, fold, type Cell } from "./text.ts";

export const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Cefr = (typeof CEFR)[number];
export const KINDS = { w: "word", p: "phrase", s: "sentence" } as const;
export type Kind = (typeof KINDS)[keyof typeof KINDS];
export const POS = [
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition",
  "conjunction", "determiner", "numeral", "interjection", "phrase",
] as const;
export type Status = "active" | "needs_review" | "disabled";

export type LanguageConfig = {
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
  /** Article -> grammatical gender, used to derive gender and article-less answers. */
  nounArticles: Record<string, string>;
  /** Expected to be fully translated; a missing cell is an error, not a warning. */
  core: boolean;
};

export type Source = {
  id: string;
  name: string;
  source_type: "editorial" | "dataset" | "reference_data";
  source_url: string | null;
  license: string;
  license_url: string | null;
  author: string | null;
  attribution_text: string;
  commercial_use_allowed: boolean;
  modification_allowed: boolean;
  share_alike: boolean;
  requires_item_attribution: boolean;
  item_url_template: string | null;
  is_enabled: boolean;
  license_verified_at: string | null;
  notes: string | null;
};

export type Curriculum = {
  courses: { language: string; title: string; description: string }[];
  units: {
    key: string;
    cefr: Cefr;
    title: string;
    description: string;
    language?: string;
    skills: {
      key: string;
      title: string;
      description: string;
      icon: string;
      language?: string;
    }[];
  }[];
};

export type Concept = {
  key: string;
  kind: Kind;
  pos: string | null;
  cefr: Cefr;
  skill: string;
  topic: string;
  gloss: string;
  situation: string | null;
  social: boolean;
  /** Proper noun (country, weekday...): no article expected. */
  proper: boolean;
  group: string | null;
  status: Status;
  source: string;
  file: string;
  line: number;
};

export type Translation = {
  key: string;
  lang: string;
  text: string;
  alternatives: string[];
  tokens: string[];
  displayTokens: string[];
  focus: string | null;
  focusPos: string | null;
  clozeIndex: number | null;
  clozePos: string | null;
  gender: string | null;
  note: string | null;
  status: Status;
  source: string;
  externalId: string | null;
  author: string | null;
  license: string | null;
  file: string;
  line: number;
};

export type Model = {
  root: string;
  languages: Record<string, LanguageConfig>;
  sources: Source[];
  curriculum: Curriculum;
  concepts: Map<string, Concept>;
  /** key -> lang -> translation */
  translations: Map<string, Map<string, Translation>>;
  /** Problems found while parsing; validate() adds the semantic ones. */
  issues: Issue[];
};

export type Issue = {
  level: "error" | "warning";
  code: string;
  message: string;
  where?: string;
};

type Table = { directives: Record<string, string>; header: string[]; rows: { cells: string[]; line: number }[] };

/** TSV with "#name: value" directives and "#" comments, first non-comment line is the header. */
export function readTsv(path: string): Table {
  const directives: Record<string, string> = {};
  const rows: Table["rows"] = [];
  let header: string[] | null = null;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    if (raw.startsWith("#")) {
      const m = /^#\s*([a-z_]+):\s*(.+)$/.exec(raw);
      if (m) directives[m[1]] = m[2].trim();
      return;
    }
    const cells = raw.split("\t").map((c) => c.trim());
    if (!header) header = cells;
    else rows.push({ cells, line: i + 1 });
  });
  return { directives, header: header ?? [], rows };
}

function listTsv(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsv"))
    .sort()
    .map((f) => join(dir, f));
}

function parseFlags(raw: string) {
  const flags = { social: false, proper: false, group: null as string | null, gloss: null as string | null, status: null as Status | null };
  for (const part of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...rest] = part.split("=");
    const v = rest.join("=").trim();
    if (k === "social") flags.social = true;
    else if (k === "proper") flags.proper = true;
    else if (k === "group") flags.group = v;
    else if (k === "gloss") flags.gloss = v;
    else if (k === "status") flags.status = v as Status;
  }
  return flags;
}

export function loadModel(root: string): Model {
  const readJson = <T,>(name: string): T => JSON.parse(readFileSync(join(root, name), "utf8")) as T;
  const languages = readJson<Record<string, LanguageConfig>>("languages.json");
  const sources = readJson<Source[]>("sources.json");
  const curriculum = readJson<Curriculum>("curriculum.json");
  const issues: Issue[] = [];

  const unitOfSkill = new Map<string, Curriculum["units"][number]>();
  for (const unit of curriculum.units) for (const skill of unit.skills) unitOfSkill.set(skill.key, unit);

  const concepts = new Map<string, Concept>();
  const translations = new Map<string, Map<string, Translation>>();
  const langCodes = Object.keys(languages);

  const addTranslation = (t: Translation) => {
    let byLang = translations.get(t.key);
    if (!byLang) translations.set(t.key, (byLang = new Map()));
    const existing = byLang.get(t.lang);
    if (existing) {
      issues.push({
        level: "error",
        code: "duplicate-translation",
        message: `${t.key} [${t.lang}] is defined twice (also ${existing.file}:${existing.line})`,
        where: `${t.file}:${t.line}`,
      });
      return;
    }
    byLang.set(t.lang, t);
  };

  const makeTranslation = (
    key: string, lang: string, cell: Cell, extra: Partial<Translation>, file: string, line: number,
  ): Translation => {
    const { display, bare } = tokenize(cell.text);
    return {
      key, lang,
      text: cell.text,
      alternatives: cell.alternatives,
      tokens: bare,
      displayTokens: display,
      focus: cell.focus,
      focusPos: cell.focusPos,
      clozeIndex: null,
      clozePos: null,
      gender: cell.gender,
      note: null,
      status: "active",
      source: "lingua-match-editorial",
      externalId: null,
      author: null,
      license: null,
      file, line,
      ...extra,
    };
  };

  // Concepts, with optional wide language columns.
  for (const file of listTsv(join(root, "concepts"))) {
    const table = readTsv(file);
    const source = table.directives.source ?? "lingua-match-editorial";
    const col = (name: string) => table.header.indexOf(name);
    for (const required of ["key", "kind", "skill"]) {
      if (col(required) < 0) issues.push({ level: "error", code: "missing-column", message: `${file} has no "${required}" column` });
    }
    for (const { cells, line } of table.rows) {
      const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? "" : "");
      const key = get("key");
      const where = `${file}:${line}`;
      if (concepts.has(key)) {
        issues.push({ level: "error", code: "duplicate-concept", message: `Concept "${key}" defined twice`, where });
        continue;
      }
      const kind = KINDS[get("kind") as keyof typeof KINDS];
      const skill = get("skill");
      const unit = unitOfSkill.get(skill);
      const flags = parseFlags(get("flags"));
      const en = get("en") ? parseCell(get("en")).text : "";
      const cefr = (get("cefr") || unit?.cefr || "") as Cefr;
      concepts.set(key, {
        key,
        kind,
        pos: get("pos") || (kind === "word" ? null : "phrase"),
        cefr,
        skill,
        topic: get("topic") || skill,
        gloss: flags.gloss ?? (en || key),
        situation: get("situation") || null,
        social: flags.social,
        proper: flags.proper,
        group: flags.group,
        status: flags.status ?? "active",
        source,
        file, line,
      });
      if (!kind) issues.push({ level: "error", code: "bad-kind", message: `Unknown kind "${get("kind")}" (use w, p or s)`, where });
      for (const lang of langCodes) {
        const raw = get(lang);
        if (raw) addTranslation(makeTranslation(key, lang, parseCell(raw), { source }, file, line));
      }
    }
  }

  // Narrow per-language files: key, text, [note, ext_id, author, license, status].
  for (const lang of langCodes) {
    for (const file of listTsv(join(root, lang))) {
      const table = readTsv(file);
      const source = table.directives.source ?? "lingua-match-editorial";
      const col = (name: string) => table.header.indexOf(name);
      for (const { cells, line } of table.rows) {
        const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? "" : "");
        addTranslation(
          makeTranslation(get("key"), lang, parseCell(get("text")), {
            source,
            note: get("note") || null,
            externalId: get("ext_id") || null,
            author: get("author") || null,
            license: get("license") || null,
            status: (get("status") as Status) || "active",
          }, file, line),
        );
      }
    }
  }

  const model: Model = { root, languages, sources, curriculum, concepts, translations, issues };
  deriveFields(model);
  return model;
}

/**
 * Everything computed rather than typed: noun gender and article-less answers,
 * the gap in missing-word exercises and its part of speech, and the
 * near-synonym groups that must never distract each other.
 */
function deriveFields(model: Model) {
  // Word lookup per language for gap POS: folded text / last token -> concept.
  const wordIndex = new Map<string, Map<string, Concept>>();
  for (const [key, byLang] of model.translations) {
    const concept = model.concepts.get(key);
    if (!concept || concept.kind !== "word") continue;
    for (const t of byLang.values()) {
      let idx = wordIndex.get(t.lang);
      if (!idx) wordIndex.set(t.lang, (idx = new Map()));
      for (const form of [t.text, ...t.alternatives, t.tokens[t.tokens.length - 1] ?? ""]) {
        if (form && !idx.has(fold(form))) idx.set(fold(form), concept);
      }
    }
  }

  for (const [key, byLang] of model.translations) {
    const concept = model.concepts.get(key);
    if (!concept) continue;
    for (const t of byLang.values()) {
      const cfg = model.languages[t.lang];

      if (concept.kind === "word" && concept.pos === "noun" && cfg) {
        const [article, ...rest] = t.text.split(" ");
        const g = cfg.nounArticles[article?.toLowerCase() ?? ""];
        if (g && rest.length > 0) {
          t.gender ??= g;
          const bare = rest.join(" ");
          if (!t.alternatives.some((a) => fold(a) === fold(bare))) t.alternatives.push(bare);
        }
      }
      // English verbs are written "to eat"; "eat" is also right.
      if (t.lang === "en" && concept.pos === "verb" && t.text.startsWith("to ")) {
        const bare = t.text.slice(3);
        if (!t.alternatives.includes(bare)) t.alternatives.push(bare);
      }

      if (t.focus) {
        const i = t.tokens.findIndex((tok) => tok === t.focus);
        const j = i >= 0 ? i : t.tokens.findIndex((tok) => fold(tok) === fold(t.focus!));
        if (j >= 0) {
          t.clozeIndex = j;
          t.clozePos = t.focusPos ?? wordIndex.get(t.lang)?.get(fold(t.tokens[j]))?.pos ?? "other";
        }
      }
    }
  }

  // Union concepts whose realisations collide in any language ("you" for du /
  // ihr / Sie in English; Turkish "yemek" for both "food" and "to eat").
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    const p = parent.get(k) ?? k;
    if (p === k) return k;
    const r = find(p);
    parent.set(k, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  const byExplicit = new Map<string, string>();
  for (const c of model.concepts.values()) {
    if (!c.group) continue;
    const first = byExplicit.get(c.group);
    if (first) union(c.key, first);
    else byExplicit.set(c.group, c.key);
  }
  const seen = new Map<string, string>();
  for (const [key, byLang] of model.translations) {
    const concept = model.concepts.get(key);
    if (!concept) continue;
    for (const t of byLang.values()) {
      for (const form of [t.text, ...t.alternatives]) {
        const id = `${concept.kind === "sentence" ? "s" : "w"}|${t.lang}|${fold(form)}`;
        const other = seen.get(id);
        if (other && other !== key) union(key, other);
        else seen.set(id, key);
      }
    }
  }
  const members = new Map<string, string[]>();
  for (const key of model.concepts.keys()) {
    const r = find(key);
    members.set(r, [...(members.get(r) ?? []), key]);
  }
  for (const [rootKey, keys] of members) {
    if (keys.length < 2) continue;
    const name = model.concepts.get(rootKey)?.group ?? `auto:${[...keys].sort()[0]}`;
    for (const k of keys) model.concepts.get(k)!.group = name;
  }
}

export function contentFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir).sort()) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsv|json)$/.test(f)) out.push(p);
    }
  };
  walk(root);
  return out;
}
