/**
 * Text helpers shared by every content script.
 *
 * norm() and fold() mirror learn_norm() / learn_fold() in
 * supabase/migrations/99993_content_engine_functions.sql. The database grades
 * answers with its own copy; these exist so the build can catch, before
 * anything is seeded, two options a learner could not tell apart.
 */

const FOLD_FROM = "áàâäãåāçćčéèêëēęėğíìîïīıłñńňóòôöõøōőśşšúùûüūűůýÿźżž";
const FOLD_TO = "aaaaaaaccceeeeeeegiiiiiilnnnoooooooosssuuuuuuuyyzzz";
const FOLD_MAP = new Map([...FOLD_FROM].map((ch, i) => [ch, FOLD_TO[i]]));

/** Lower case, no punctuation, single spaces. Accents still count. */
export function norm(text: string): string {
  return text
    .normalize("NFC")
    .replaceAll("İ", "i")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[\p{P}$+<=>^`|~]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** norm() with accents folded away: "Straße" == "strasse", "çay" == "cay". */
export function fold(text: string): string {
  return [...norm(text).replaceAll("ß", "ss")]
    .map((ch) => FOLD_MAP.get(ch) ?? ch)
    .join("");
}

/** Tidies what an editor typed: NFC, straight apostrophes, single spaces. */
export function cleanText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Punctuation that can sit at either end of a word: ¿¡ «» quotes, commas...
const EDGE_PUNCT = /^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu;

export type Tokens = {
  /** Whitespace-split, punctuation kept: what a sentence looks like. */
  display: string[];
  /** Same positions, punctuation stripped: word-order tiles, cloze answers. */
  bare: string[];
};

/**
 * One bare token per display token, always. The database relies on that
 * one-to-one mapping to rebuild "Ich ___ jeden Morgen Kaffee." from a gap
 * index, so a token that is pure punctuation ("–") is an error, not dropped.
 */
export function tokenize(text: string): Tokens {
  const display = text.trim().split(/\s+/).filter(Boolean);
  const bare = display.map((t) => t.replace(EDGE_PUNCT, ""));
  return { display, bare };
}

/** Parses the authoring mini-syntax inside one language cell. See content/README.md. */
export type Cell = {
  text: string;
  alternatives: string[];
  focus: string | null;
  focusPos: string | null;
  gender: string | null;
};

export function parseCell(raw: string): Cell {
  let gender: string | null = null;
  let body = raw.replace(/\s*\{(m|f|n|c|pl)\}\s*$/, (_, g: string) => {
    gender = g;
    return "";
  });
  const [first, ...alts] = body.split(" | ").map((s) => s.trim());
  body = first ?? "";

  let focus: string | null = null;
  let focusPos: string | null = null;
  const text = cleanText(
    body.replace(/\[([^\]:]+)(?::([a-z]+))?\]/, (_, word: string, pos?: string) => {
      focus = word;
      focusPos = pos ?? null;
      return word;
    }),
  );

  return {
    text,
    alternatives: alts.map(cleanText).filter(Boolean),
    focus,
    focusPos,
    gender,
  };
}

export function sqlString(value: string | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return `'${value.replaceAll("'", "''")}'`;
}

export function sqlTextArray(values: string[] | null | undefined): string {
  if (!values) return "null::text[]";
  if (values.length === 0) return "'{}'::text[]";
  return `array[${values.map(sqlString).join(", ")}]::text[]`;
}

/** Small, stable hash for batch labels. */
export function shortHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
