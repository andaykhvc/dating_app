import { LEGAL_DRAFT_MODE, LEGAL_ENTITY, legalReleaseIssues } from "../src/lib/legal.ts";

const issues = legalReleaseIssues(LEGAL_ENTITY, LEGAL_DRAFT_MODE);
if (issues.length) {
  console.error("Legal pre-launch gate FAILED. Resolve these fields/review decisions before release:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Legal pre-launch gate PASSED: required facts/applicability decisions are present and draft mode is off.");
  console.log("This checks configuration only. It does not replace legal approval or testing actual contact channels.");
}
