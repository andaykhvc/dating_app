// Checks that every translation file has exactly the keys of en.json (the source
// of truth) and the same {placeholders}. Plural forms (key_one, key_other, ...)
// may differ between languages, because languages have different plural
// categories; their base key and placeholders must still match.
//
//   npm run i18n:check
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

export function flatten(tree, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else if (value && typeof value === "object") Object.assign(out, flatten(value, path));
    else out[path] = value; // not a string: reported below
  }
  return out;
}

/** base key -> set of placeholders used by any of its plural forms */
function describe(flat) {
  const byBase = new Map();
  for (const [key, value] of Object.entries(flat)) {
    const base = key.replace(PLURAL_SUFFIX, "");
    const entry = byBase.get(base) ?? { placeholders: new Set(), plural: false };
    if (typeof value === "string") {
      for (const m of value.matchAll(/\{(\w+)\}/g)) entry.placeholders.add(m[1]);
    }
    if (PLURAL_SUFFIX.test(key)) entry.plural = true;
    byBase.set(base, entry);
  }
  return byBase;
}

/** Returns a list of problems (empty when the file is fine). */
export function checkMessages(en, other, name) {
  const problems = [];
  const flatEn = flatten(en);
  const flatOther = flatten(other);

  for (const [key, value] of Object.entries(flatOther)) {
    if (typeof value !== "string") problems.push(`${name}: "${key}" is not a string`);
  }

  const a = describe(flatEn);
  const b = describe(flatOther);

  for (const base of a.keys()) {
    if (!b.has(base)) problems.push(`${name}: missing key "${base}"`);
  }
  for (const base of b.keys()) {
    if (!a.has(base)) problems.push(`${name}: extra key "${base}" (not in en.json)`);
  }
  for (const [base, entry] of a) {
    const mine = b.get(base);
    if (!mine) continue;
    const want = [...entry.placeholders].sort().join(",");
    const have = [...mine.placeholders].sort().join(",");
    if (want !== have) {
      problems.push(`${name}: "${base}" placeholders differ (en: {${want}} vs ${name}: {${have}})`);
    }
  }
  return problems;
}

export function checkDirectory(dir) {
  const en = JSON.parse(readFileSync(new URL("en.json", dir), "utf8"));
  const problems = [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json");
  for (const file of files) {
    const other = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
    problems.push(...checkMessages(en, other, file));
  }
  return { problems, files };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = new URL("../src/i18n/messages/", import.meta.url);
  const { problems, files } = checkDirectory(dir);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    console.error(`\n✗ i18n check failed (${problems.length} problem${problems.length === 1 ? "" : "s"})`);
    process.exit(1);
  }
  console.log(`✓ i18n check passed: ${files.join(", ")} match en.json`);
}
