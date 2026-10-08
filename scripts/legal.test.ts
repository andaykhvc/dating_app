import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { privacyDe } from "../src/content/legal/privacy.de.ts";
import { privacyEn } from "../src/content/legal/privacy.en.ts";
import { legalMetadata, privacyMetadata } from "../src/content/legal/metadata.ts";
import { termsDe } from "../src/content/legal/terms.de.ts";
import { termsEn } from "../src/content/legal/terms.en.ts";
import { imprintDe } from "../src/content/legal/imprint.de.ts";
import { imprintEn } from "../src/content/legal/imprint.en.ts";
import { REPORT_REASONS } from "../src/types/domain.ts";
import { REPORT_REASON_LABELS } from "../src/lib/constants.ts";
import {
  LEGAL_ENTITY, legalPagesIndexable, legalSiteOrigin, isPrivacyPath, isPublicLegalPath,
  legalEntityFromValues, imprintFieldIssues, legalReleaseIssues, phoneHref, contactFormHref,
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

test("public legal bypass admits exactly the six documents, never a nested or similar private path", () => {
  for (const path of ["/privacy", "/datenschutz", "/terms", "/nutzungsbedingungen", "/imprint", "/impressum"]) {
    assert.equal(isPublicLegalPath(path), true);
  }
  for (const path of ["/", "/profile/settings", "/privacy/admin", "/terms/admin", "/terms-extra", "/nutzungsbedingungen/private", "/nutzungsbedingungen-extra", "/Terms", "/imprint/admin", "/impressum-extra"]) {
    assert.equal(isPublicLegalPath(path), false);
  }
});

const sampleValues = {
  name: "Beispielperson (Test)", address: "Musterstraße 1\n00000 Beispielstadt\nDeutschland",
  email: "contact@example.invalid", phone: "+49 000 000000",
  operatorType: "individual", registerRequired: "false", vatIdRequired: "false",
  businessIdRequired: "false", regulatedActivity: "false", editorialContent: "false",
};

test("imprint editions share sections, version and document-specific metadata", () => {
  assert.equal(imprintDe.version, imprintEn.version);
  assert.equal(imprintDe.lastUpdated, imprintEn.lastUpdated);
  const origin = legalSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  for (const policy of [imprintDe, imprintEn]) {
    assert.deepEqual(policy.sections.map((section) => section.id), ["provider", "contact", "applicability", "related"]);
    assert.equal(policy.summary.length, 5);
    const metadata = legalMetadata(policy);
    assert.equal(metadata.alternates?.canonical, `${origin}${policy.language === "de" ? "/impressum" : "/imprint"}`);
    assert.deepEqual(metadata.alternates?.languages, {
      de: `${origin}/impressum`, en: `${origin}/imprint`, "x-default": `${origin}/impressum`,
    });
    assert.deepEqual(metadata.robots, { index: false, follow: true });
  }
});

test("explicit blank values clear owner defaults instead of silently restoring personal details", () => {
  const entity = legalEntityFromValues({ name: " ", address: "", email: "", operatorType: "" });
  assert.equal(entity.name, null);
  assert.equal(entity.address, null);
  assert.equal(entity.email, null);
  assert.equal(entity.operatorType, null);
  assert.equal(legalEntityFromValues({}).name, LEGAL_ENTITY.name);
});

test("release gate requires a second real channel, confirmed applicability and draft approval", () => {
  const entity = legalEntityFromValues(sampleValues);
  assert.deepEqual(legalReleaseIssues(entity, false), []);
  assert.ok(legalReleaseIssues(entity, true).includes("LEGAL_DRAFT_MODE (legal review pending)"));
  assert.ok(imprintFieldIssues({ ...entity, phone: null }).includes("phone or contactFormUrl"));
  assert.deepEqual(imprintFieldIssues({ ...entity, phone: null, contactFormUrl: "https://example.invalid/contact" }), []);
  for (const field of ["registerRequired", "vatIdRequired", "businessIdRequired", "regulatedActivity", "editorialContent"] as const) {
    assert.ok(imprintFieldIssues({ ...entity, [field]: null }).some((issue) => issue.startsWith(field)));
  }
  assert.ok(imprintFieldIssues({ ...entity, email: "invalid" }).includes("email (invalid)"));
  assert.ok(imprintFieldIssues({ ...entity, address: "Postfach 123" }).includes("address (P.O. box)"));
});

test("conditional organization, register, IDs, professional and editorial details are enforced", () => {
  const entity = legalEntityFromValues(sampleValues);
  const conditional = {
    ...entity, operatorType: "organization" as const, registerRequired: true, vatIdRequired: true,
    businessIdRequired: true, regulatedActivity: true, editorialContent: true,
  };
  const required = ["legalForm", "representative", "commercialRegister", "vatId", "businessId", "supervisoryAuthority", "professionalDetails", "contentResponsibleName", "contentResponsibleAddress"];
  assert.deepEqual(imprintFieldIssues(conditional), required);
  const filled = { ...conditional };
  for (const field of required) Object.assign(filled, { [field]: "Synthetic test disclosure" });
  assert.deepEqual(imprintFieldIssues(filled), []);
});

test("contact links reject unsafe URLs, credentials and non-phone text", () => {
  assert.equal(phoneHref("+49 000 000000"), "tel:+49000000000");
  assert.equal(contactFormHref("https://example.invalid/contact"), "https://example.invalid/contact");
  for (const input of [null, "mailto:contact@example.invalid", "javascript:alert(1)", "https://user:secret@example.invalid/", "//example.invalid/contact", "http://example.invalid/contact"]) assert.equal(contactFormHref(input), null);
  for (const input of [null, "phone", "123", "+49000;extension=1"]) assert.equal(phoneHref(input), null);
});

test("plain Node pre-launch command fails for the real draft and passes a complete sample with draft mode off", () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("NEXT_PUBLIC_LEGAL_")) delete env[key];
  const script = fileURLToPath(new URL("./legal-check.mjs", import.meta.url));
  const draft = spawnSync(process.execPath, [script], { env, encoding: "utf8" });
  assert.equal(draft.status, 1);
  assert.match(draft.stderr, /LEGAL_DRAFT_MODE/);
  assert.match(draft.stderr, /registerRequired/);
  const sample = {
    ...env, NEXT_PUBLIC_LEGAL_NAME: sampleValues.name, NEXT_PUBLIC_LEGAL_ADDRESS: sampleValues.address,
    NEXT_PUBLIC_LEGAL_EMAIL: sampleValues.email, NEXT_PUBLIC_LEGAL_PHONE: sampleValues.phone,
    NEXT_PUBLIC_LEGAL_OPERATOR_TYPE: "individual", NEXT_PUBLIC_LEGAL_REGISTER_REQUIRED: "false",
    NEXT_PUBLIC_LEGAL_VAT_ID_REQUIRED: "false", NEXT_PUBLIC_LEGAL_BUSINESS_ID_REQUIRED: "false",
    NEXT_PUBLIC_LEGAL_REGULATED_ACTIVITY: "false", NEXT_PUBLIC_LEGAL_EDITORIAL_CONTENT: "false",
    NEXT_PUBLIC_LEGAL_DRAFT_MODE: "false",
  };
  const approved = spawnSync(process.execPath, [script], { env: sample, encoding: "utf8" });
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /PASSED/);
  const invalidSwitch = spawnSync(process.execPath, [script], { env: { ...sample, NEXT_PUBLIC_LEGAL_DRAFT_MODE: "off" }, encoding: "utf8" });
  assert.equal(invalidSwitch.status, 1);
  const missingButApproved = spawnSync(process.execPath, [script], { env: { ...sample, NEXT_PUBLIC_LEGAL_NAME: "" }, encoding: "utf8" });
  assert.equal(missingButApproved.status, 1);
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
