import { test } from "node:test";
import assert from "node:assert/strict";
import {
  THEME_COLORS,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  parseThemePreference,
  themeColorFor,
} from "../src/lib/theme.ts";

test("only light and dark are explicit choices; anything else is System", () => {
  assert.equal(parseThemePreference("light"), "light");
  assert.equal(parseThemePreference("dark"), "dark");
  assert.equal(parseThemePreference("system"), "system");
  assert.equal(parseThemePreference(null), "system");
  assert.equal(parseThemePreference("DARK"), "system");
  assert.equal(parseThemePreference(42), "system");
});

test("browser colour follows the choice, or the OS on System", () => {
  assert.equal(themeColorFor("system", "dark"), THEME_COLORS.dark);
  assert.equal(themeColorFor("system", "light"), THEME_COLORS.light);
  assert.equal(themeColorFor("dark", "light"), THEME_COLORS.dark);
  assert.equal(themeColorFor("light", "dark"), THEME_COLORS.light);
});

// The inline script must set data-theme from storage, ignore bad values, and
// survive storage that throws.
function runInitScript(stored: string | null, throws = false) {
  const attrs: Record<string, string> = {};
  const globals = globalThis as Record<string, unknown>;
  globals.localStorage = {
    getItem(key: string) {
      if (throws) throw new Error("blocked");
      assert.equal(key, THEME_STORAGE_KEY);
      return stored;
    },
  };
  globals.document = {
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
  };
  try {
    new Function(THEME_INIT_SCRIPT)();
  } finally {
    delete globals.localStorage;
    delete globals.document;
  }
  return attrs;
}

test("init script applies a saved choice before paint", () => {
  assert.deepEqual(runInitScript("dark"), { "data-theme": "dark" });
  assert.deepEqual(runInitScript("light"), { "data-theme": "light" });
});

test("init script leaves System alone, including when storage throws", () => {
  assert.deepEqual(runInitScript(null), {});
  assert.deepEqual(runInitScript("purple"), {});
  assert.deepEqual(runInitScript(null, true), {});
});
