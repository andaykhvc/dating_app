import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  EXCLUDED_TABLES,
  EXPORT_FUNCTION_SECTIONS,
  EXPORT_TABLES,
  buildExportDocument,
} from "../src/lib/account-export.ts";

const MIGRATIONS = new URL("../supabase/migrations/", import.meta.url);

function tablesInMigrations(): string[] {
  const names = new Set<string>();
  for (const file of readdirSync(MIGRATIONS)) {
    if (!file.endsWith(".sql")) continue;
    const sql = readFileSync(new URL(file, MIGRATIONS), "utf8");
    for (const m of sql.matchAll(/^create table (?:if not exists )?(?:public\.)?([a-z_0-9]+)/gim)) {
      names.add(m[1]);
    }
  }
  return [...names];
}

test("every table is either exported or explicitly excluded with a reason", () => {
  const exported = new Set(EXPORT_TABLES.map((t) => t.table));
  const missing = tablesInMigrations().filter((t) => !exported.has(t) && !(t in EXCLUDED_TABLES));
  assert.deepEqual(
    missing,
    [],
    `Add these tables to EXPORT_TABLES or EXCLUDED_TABLES in src/lib/account-export.ts: ${missing.join(", ")}`,
  );
});

test("exported and excluded lists only name tables that exist", () => {
  const existing = new Set(tablesInMigrations());
  for (const t of EXPORT_TABLES) assert.ok(existing.has(t.table), `unknown table ${t.table}`);
  for (const t of Object.keys(EXCLUDED_TABLES)) assert.ok(existing.has(t), `unknown excluded table ${t}`);
  const both = EXPORT_TABLES.filter((t) => t.table in EXCLUDED_TABLES);
  assert.deepEqual(both, [], "a table cannot be both exported and excluded");
});

test("export keys are unique", () => {
  const keys = [...EXPORT_TABLES.map((t) => t.key), ...EXPORT_FUNCTION_SECTIONS, "account", "_about"];
  assert.equal(new Set(keys).size, keys.length);
});

test("the document has an _about section and every section, even when empty", () => {
  const doc = buildExportDocument(
    {
      account: { id: "u1", email: "a@example.com" },
      tables: { messages: [{ id: 1, body: "hi" }] },
      functions: {},
      truncatedTables: ["messages"],
    },
    new Date("2026-01-02T03:04:05Z"),
  );
  assert.equal(doc._about.exported_at, "2026-01-02T03:04:05.000Z");
  assert.deepEqual(doc._about.truncated_tables, ["messages"]);
  assert.ok(doc._about.excluded.length > 0);
  for (const t of EXPORT_TABLES) assert.ok(t.key in doc, `missing section ${t.key}`);
  for (const key of EXPORT_FUNCTION_SECTIONS) assert.deepEqual(doc[key], []);
  assert.equal(doc.profile, null);
  assert.deepEqual(doc.messages, [{ id: 1, body: "hi" }]);
});
