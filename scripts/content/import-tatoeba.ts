/**
 * npm run content:import:tatoeba -- --dir <downloads> [--langs de,es,nl,tr] [--max 300]
 *                                   [--status needs_review|active] [--allow-names]
 *
 * Offline importer. Download the exports yourself (weekly, CC BY 2.0 FR):
 *
 *   https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2
 *   https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_CC0.tsv.bz2
 *   https://downloads.tatoeba.org/exports/per_language/deu/deu_sentences_detailed.tsv.bz2
 *   https://downloads.tatoeba.org/exports/per_language/deu/deu_sentences_CC0.tsv.bz2
 *   https://downloads.tatoeba.org/exports/per_language/eng/eng-deu_links.tsv.bz2
 *   ... and the same for spa, nld, tur
 *
 * then `bunzip2 *.bz2` into one folder and point --dir at it. Nothing here
 * talks to Tatoeba; the app never does either.
 *
 * Output (review before committing):
 *   content/concepts/tatoeba.tsv     one concept per English pivot sentence
 *   content/<lang>/tatoeba.tsv       the linked sentence in each language,
 *                                    with Tatoeba id, contributor and licence
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadModel } from "./lib/model.ts";
import { loadBlocklist } from "./lib/validate.ts";
import { fold } from "./lib/text.ts";
import {
  TATOEBA_CODES, buildCandidates, buildLexicon, parseDetailed, parseIds, parseLinks,
  rejectReason, toTsv, type TatoebaSentence,
} from "./lib/tatoeba.ts";

const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const dir = arg("dir");
if (!dir) {
  console.error("Usage: npm run content:import:tatoeba -- --dir <folder with decompressed exports>");
  process.exit(1);
}
const root = arg("root", join(import.meta.dirname, "../../content"))!;
const langs = arg("langs", "de,es,nl,tr")!.split(",");
const max = Number(arg("max", "300"));
const status = (arg("status", "needs_review") as "needs_review" | "active");
const allowNames = args.includes("--allow-names");

const model = loadModel(root);
const blocklist = loadBlocklist(model);
const lexicons = buildLexicon(model);

const existingFolds: Record<string, Set<string>> = {};
for (const byLang of model.translations.values()) {
  for (const t of byLang.values()) {
    // Earlier Tatoeba imports are replaced, not treated as duplicates.
    if (t.source === "tatoeba") continue;
    (existingFolds[t.lang] ??= new Set()).add(fold(t.text));
  }
}

const read = (name: string) => {
  const path = join(dir, name);
  if (!existsSync(path)) {
    console.error(`Missing ${path} — see the download list at the top of this script.`);
    process.exit(1);
  }
  return readFileSync(path, "utf8");
};
const readOptional = (name: string) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8") : "");

const rejected: Record<string, number> = {};
function load(lang: string): Map<string, TatoebaSentence> {
  const code = TATOEBA_CODES[lang];
  const cc0 = parseIds(readOptional(`${code}_sentences_CC0.tsv`));
  const out = new Map<string, TatoebaSentence>();
  for (const s of parseDetailed(read(`${code}_sentences_detailed.tsv`), lang, cc0)) {
    const reason = rejectReason(s, { maxTokens: 10, maxChars: 70, blocklist: blocklist[lang] ?? [], allowNames });
    if (reason) rejected[`${lang}:${reason}`] = (rejected[`${lang}:${reason}`] ?? 0) + 1;
    else out.set(s.id, s);
  }
  return out;
}

const english = load("en");
const englishIds = new Set(english.keys());
const targets: Record<string, Map<string, TatoebaSentence>> = {};
const links: Record<string, Map<string, string[]>> = {};
for (const lang of langs) {
  targets[lang] = load(lang);
  links[lang] = parseLinks(read(`eng-${TATOEBA_CODES[lang]}_links.tsv`), englishIds);
}

const { candidates, rejected: clusterRejected } = buildCandidates({
  english, targets, links, lexicons, requiredLangs: langs, existingFolds,
});
const picked = candidates.slice(0, max);
const { concepts, perLang } = toTsv(picked, status);

writeFileSync(join(root, "concepts", "tatoeba.tsv"), concepts);
for (const [lang, tsv] of Object.entries(perLang)) {
  mkdirSync(join(root, lang), { recursive: true });
  writeFileSync(join(root, lang, "tatoeba.tsv"), tsv);
}

console.log(`Tatoeba: ${picked.length} concepts written (${candidates.length} passed, status ${status}).`);
console.log("Rejected sentences:", rejected);
console.log("Rejected clusters:", clusterRejected);
console.log("Next: review the files, set status to active for good rows, then npm run content:build.");
