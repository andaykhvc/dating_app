import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/redirect.ts";

test("keeps plain same-site paths, including query and hash", () => {
  assert.equal(safeNextPath("/discover", "/x"), "/discover");
  assert.equal(safeNextPath("/messages/abc?phrase=1#top", "/x"), "/messages/abc?phrase=1#top");
  assert.equal(safeNextPath("/", "/x"), "/");
});

test("falls back when nothing was asked for", () => {
  assert.equal(safeNextPath(null, "/x"), "/x");
  assert.equal(safeNextPath(undefined, "/x"), "/x");
  assert.equal(safeNextPath("", "/x"), "/x");
});

test("rejects destinations that leave the site", () => {
  for (const bad of [
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "https://evil.com",
    "http://evil.com",
    "javascript:alert(1)",
    "@evil.com",
    ".evil.com",
    "evil.com",
    "discover",
  ]) {
    assert.equal(safeNextPath(bad, "/x"), "/x", `should reject ${JSON.stringify(bad)}`);
  }
});

test("a rejected value cannot change the host of the callback redirect", () => {
  const origin = "https://app.example";
  for (const bad of ["@evil.com", ".evil.com", "//evil.com"]) {
    const target = new URL(`${origin}${safeNextPath(bad, "/onboarding/basics")}`);
    assert.equal(target.origin, origin);
  }
});
