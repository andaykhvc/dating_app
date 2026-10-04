import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { Linter } from "eslint";

const require = createRequire(import.meta.url);
const nextPlugin = require("@next/eslint-plugin-next");
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "lingua-match-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const app of ["web", "admin"]) {
    const pages = join(root, "apps", app, "pages");
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(pages, "lint-fixture.jsx"), "export default function Page() { return null; }");
  }
  writeFileSync(join(root, "apps", "README.md"), "Not an application directory.");
  return root;
}

test("Next.js root discovery matches application directories and excludes files", (t) => {
  const root = fixture(t);
  const roots = getRootDirs({
    cwd: root,
    settings: { next: { rootDir: join(root, "apps", "*") } },
  });
  assert.deepEqual(roots.map((dir) => resolve(dir)).sort(), [
    join(root, "apps", "admin"),
    join(root, "apps", "web"),
  ]);
});

test("Next.js internal-link rule still works with the scoped glob replacement", (t) => {
  const root = fixture(t);
  const linter = new Linter();
  for (const rootDir of [
    undefined,
    join(root, "apps", "web"),
    join(root, "apps", "*"),
    join(root, "apps", "{web,admin}"),
    [join(root, "apps", "web"), join(root, "apps", "admin")],
  ]) {
    const config = {
      files: ["**/*.jsx"],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { "@next/next": nextPlugin },
      settings: { next: { rootDir } },
      rules: {
        "@next/next/no-html-link-for-pages": ["error", ...(rootDir ? [] : [join(root, "apps", "web", "pages")])],
      },
    };
    const internal = linter.verify('const link = <a href="/lint-fixture/">Home</a>;', config, "fixture.jsx");
    assert.equal(internal.length, 1, JSON.stringify(rootDir) ?? "default root");
    assert.equal(internal[0].ruleId, "@next/next/no-html-link-for-pages");
    assert.deepEqual(linter.verify('const link = <a href="https://example.com/">External</a>;', config, "fixture.jsx"), []);
  }
  assert.equal(pluginRequire("fast-glob/package.json").name, "tinyglobby");
});
