import { test } from "node:test";
import assert from "node:assert/strict";
import { pendingLegal } from "../src/lib/legal-consent.ts";

const current = { terms: "2026-10-08", privacy: "2026-10-08" };

test("nothing on file means first acceptance", () => {
  assert.equal(pendingLegal(null, current), "first");
  assert.equal(pendingLegal({ terms_version: null, privacy_version: null }, current), "first");
  assert.equal(pendingLegal({ terms_version: "2026-10-08", privacy_version: null }, current), "first");
});

test("up to date means nothing pending", () => {
  assert.equal(pendingLegal({ terms_version: "2026-10-08", privacy_version: "2026-10-08" }, current), null);
});

test("a changed version asks again, once a version is accepted it stops", () => {
  const stale = { terms_version: "2026-01-01", privacy_version: "2026-10-08" };
  assert.equal(pendingLegal(stale, current), "updated");
  assert.equal(pendingLegal({ ...stale, terms_version: "2026-10-08" }, current), null);
  assert.equal(
    pendingLegal({ terms_version: "2026-10-08", privacy_version: "2026-10-08" }, { terms: "2027-01-01", privacy: "2026-10-08" }),
    "updated",
  );
});
