/**
 * npm run content:build
 *
 * content/ -> validate -> derive lessons -> supabase/seed/001x_learn_*.sql
 *
 * Refuses to write anything if validation fails. The output is deterministic
 * for a given content tree, so a clean `git diff` after a build means the
 * committed seed matches the committed content.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadModel } from "./lib/model.ts";
import { loadBlocklist, summarize, validate } from "./lib/validate.ts";
import { deriveLessons, emitSql, stats } from "./lib/build.ts";

const root = join(import.meta.dirname, "../../content");
const out = join(import.meta.dirname, "../../supabase/seed");

const model = loadModel(root);
const { errors, warnings } = summarize(validate(model, loadBlocklist(model)));
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e.code}: ${e.message}${e.where ? `  (${e.where})` : ""}`);
  console.error(`\n✗ ${errors.length} errors — nothing written. Run npm run content:validate for details.`);
  process.exit(1);
}

const lessons = deriveLessons(model);
const files = emitSql(model, lessons);

mkdirSync(out, { recursive: true });
// Generated files only: a language removed from content/ must not leave its
// old translation file behind.
for (const f of readdirSync(out)) {
  if (/^001[0-9]_learn_.*\.sql$/.test(f)) rmSync(join(out, f));
}
for (const [name, sql] of Object.entries(files)) writeFileSync(join(out, name), sql);

console.log(`Wrote ${Object.keys(files).length} files to supabase/seed/ (${warnings.length} warnings).`);
console.log(JSON.stringify(stats(model, lessons), null, 2));
