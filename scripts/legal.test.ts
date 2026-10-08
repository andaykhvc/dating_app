import { test } from "node:test";
import assert from "node:assert/strict";
import { privacyDe } from "../src/content/legal/privacy.de.ts";
import { privacyEn } from "../src/content/legal/privacy.en.ts";
import { legalMetadata, privacyMetadata } from "../src/content/legal/metadata.ts";
import { termsDe } from "../src/content/legal/terms.de.ts";
import { termsEn } from "../src/content/legal/terms.en.ts";
import { REPORT_REASONS } from "../src/types/domain.ts";
import { REPORT_REASON_LABELS } from "../src/lib/constants.ts";
import {
  LEGAL_ENTITY, legalPagesIndexable, legalSiteOrigin, isPrivacyPath, isPublicLegalPath,
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

test("terms editions cover all required topics, five summary points and matching rule/report mappings", () => {
  const required = [
    "provider", "eligibility", "account-security", "service", "profiles-photos", "community-rules",
    "user-content", "learning-rewards", "reporting-moderation", "suspension-termination",
    "account-deletion", "availability-changes", "liability", "terms-changes", "law-venue",
    "consumer-disputes", "contact",
  ];
  const ruleIds = ["harassment", "hate", "sexual-content", "scams", "minors", "impersonation", "spam", "commercial-solicitation", "third-party-rights"];
  assert.equal(termsDe.version, termsEn.version);
  assert.equal(termsDe.lastUpdated, termsEn.lastUpdated);
  for (const policy of [termsDe, termsEn]) {
    assert.equal(policy.summary.length, 5);
    assert.deepEqual(policy.sections.map((section) => section.id), required);
    for (const section of policy.sections) {
      assert.ok(section.title.trim() && section.paragraphs.length);
      for (const link of section.links ?? []) {
        const url = new URL(link.href, "https://example.com");
        assert.equal(url.protocol, "https:");
        if (link.href.startsWith("#")) assert.ok(required.includes(url.hash.slice(1)));
      }
    }
    const rules = policy.sections.find((section) => section.id === "community-rules")!.rules!;
    assert.deepEqual(rules.map((rule) => rule.id), ruleIds);
    for (const rule of rules) {
      assert.ok(rule.title.trim() && rule.description.trim() && rule.reportReasons.length);
      for (const reason of rule.reportReasons) {
        assert.ok(REPORT_REASONS.includes(reason));
        assert.ok(REPORT_REASON_LABELS[reason].trim());
      }
    }
  }
  assert.deepEqual(
    termsDe.sections.find((section) => section.id === "community-rules")!.rules!.map((rule) => rule.reportReasons),
    termsEn.sections.find((section) => section.id === "community-rules")!.rules!.map((rule) => rule.reportReasons),
  );
});

test("public legal bypass admits exactly the four documents, never a nested or similar private path", () => {
  for (const path of ["/privacy", "/datenschutz", "/terms", "/nutzungsbedingungen"]) {
    assert.equal(isPublicLegalPath(path), true);
  }
  for (const path of ["/", "/profile/settings", "/privacy/admin", "/terms/admin", "/terms-extra", "/nutzungsbedingungen/private", "/nutzungsbedingungen-extra", "/Terms"]) {
    assert.equal(isPublicLegalPath(path), false);
  }
});

test("terms metadata switches between terms editions without borrowing privacy canonicals", () => {
  const origin = legalSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  for (const policy of [termsDe, termsEn]) {
    const metadata = legalMetadata(policy);
    assert.equal(metadata.alternates?.canonical, `${origin}${policy.language === "de" ? "/nutzungsbedingungen" : "/terms"}`);
    assert.deepEqual(metadata.alternates?.languages, {
      de: `${origin}/nutzungsbedingungen`, en: `${origin}/terms`, "x-default": `${origin}/nutzungsbedingungen`,
    });
    assert.deepEqual(metadata.robots, { index: false, follow: true });
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
