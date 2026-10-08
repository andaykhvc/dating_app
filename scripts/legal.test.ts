import { test } from "node:test";
import assert from "node:assert/strict";
import { privacyDe } from "../src/content/legal/privacy.de.ts";
import { privacyEn } from "../src/content/legal/privacy.en.ts";
import { privacyMetadata } from "../src/content/legal/metadata.ts";
import {
  LEGAL_ENTITY, legalPagesIndexable, legalSiteOrigin, isPrivacyPath,
} from "../src/lib/legal.ts";

const requiredSections = [
  "controller", "scope-sources", "data-purposes", "legal-bases", "sensitive-data",
  "visibility", "providers", "transfers", "device-storage", "retention", "security",
  "automation", "required-data", "rights", "complaints", "changes",
];

test("both editions cover the same disclosure topics with usable anchors and a shared version", () => {
  assert.equal(privacyDe.version, privacyEn.version);
  assert.equal(privacyDe.lastUpdated, privacyEn.lastUpdated);
  assert.match(privacyDe.version, /\S+/);
  assert.match(privacyDe.lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
  for (const policy of [privacyDe, privacyEn]) {
    const ids = policy.sections.map((section) => section.id);
    assert.deepEqual(ids, requiredSections);
    assert.equal(new Set(ids).size, ids.length);
    for (const section of policy.sections) {
      assert.match(section.id, /^[a-z]+(?:-[a-z]+)*$/);
      assert.ok(section.title.trim() && section.paragraphs.length);
      for (const link of section.links ?? []) {
        assert.ok(link.label.trim());
        assert.equal(new URL(link.href).protocol, "https:");
      }
    }
  }
});

test("drafts and notices missing required operator facts cannot become indexable", () => {
  const complete = { ...LEGAL_ENTITY, name: "Example", address: "Example address", email: "privacy@example.com" };
  assert.equal(legalPagesIndexable(complete, true), false);
  assert.equal(legalPagesIndexable(complete, false), true);
  for (const field of ["name", "address", "email"] as const) {
    assert.equal(legalPagesIndexable({ ...complete, [field]: null }, false), false);
  }
});

test("privacy bypass admits only the two public routes, never nested app paths", () => {
  for (const path of ["/privacy", "/datenschutz"]) assert.equal(isPrivacyPath(path), true);
  for (const path of ["/", "/profile/settings", "/privacy/admin", "/datenschutz/private", "/privacy-extra"]) {
    assert.equal(isPrivacyPath(path), false);
  }
});

test("canonical origins accept deployment URLs and reject credentialed or non-web URLs", () => {
  assert.equal(legalSiteOrigin(" https://example.com/path?preview=1 "), "https://example.com");
  assert.equal(legalSiteOrigin("http://localhost:3005"), "http://localhost:3005");
  assert.equal(legalSiteOrigin(undefined), "https://dating-app-ruddy.vercel.app");
  for (const input of ["ftp://example.com", "javascript:alert(1)", "https://user:secret@example.com", "not a URL"]) {
    assert.throws(() => legalSiteOrigin(input));
  }
});

test("language editions use distinct canonicals, reciprocal alternates, and draft noindex", () => {
  for (const [policy, path] of [[privacyDe, "/datenschutz"], [privacyEn, "/privacy"]] as const) {
    const metadata = privacyMetadata(policy);
    const origin = legalSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    assert.equal(metadata.alternates?.canonical, `${origin}${path}`);
    assert.deepEqual(metadata.alternates?.languages, {
      de: `${origin}/datenschutz`, en: `${origin}/privacy`, "x-default": `${origin}/datenschutz`,
    });
    assert.deepEqual(metadata.robots, { index: false, follow: true });
  }
});
