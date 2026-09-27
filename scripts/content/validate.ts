/**
 * npm run content:validate
 *
 * Loads content/, applies every rule in lib/validate.ts and prints a report.
 * Exits non-zero on errors so CI (or a pre-commit hook) can block bad content.
 *
 *   --warnings      print every warning, not just the count per rule
 *   --root <dir>    validate another content tree (tests use this)
 */
import { join } from "node:path";
import { loadModel } from "./lib/model.ts";
import { loadBlocklist, summarize, validate } from "./lib/validate.ts";
import { deriveLessons, stats } from "./lib/build.ts";

const args = process.argv.slice(2);
const rootArg = args.indexOf("--root");
const root = rootArg >= 0 ? args[rootArg + 1] : join(import.meta.dirname, "../../content");

const model = loadModel(root);
const issues = validate(model, loadBlocklist(model));
const { errors, warnings } = summarize(issues);

for (const e of errors) console.error(`ERROR   ${e.code.padEnd(22)} ${e.message}${e.where ? `  (${e.where})` : ""}`);

if (args.includes("--warnings")) {
  for (const w of warnings) console.warn(`warning ${w.code.padEnd(22)} ${w.message}${w.where ? `  (${w.where})` : ""}`);
} else if (warnings.length) {
  const byCode = new Map<string, number>();
  for (const w of warnings) byCode.set(w.code, (byCode.get(w.code) ?? 0) + 1);
  console.warn(`${warnings.length} warnings: ${[...byCode].map(([c, n]) => `${c} ×${n}`).join(", ")} (--warnings to list)`);
}

console.log(JSON.stringify(stats(model, deriveLessons(model)), null, 2));
console.log(errors.length ? `\n✗ ${errors.length} errors` : "\n✓ content is valid");
process.exit(errors.length ? 1 : 0);
