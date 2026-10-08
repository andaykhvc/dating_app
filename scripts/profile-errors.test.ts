import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NAME_NOT_ALLOWED_MESSAGE,
  profileErrorMessage,
} from "../src/lib/profile-errors.ts";

test("a refused name becomes a friendly message that names no word", () => {
  assert.equal(profileErrorMessage("NAME_NOT_ALLOWED"), NAME_NOT_ALLOWED_MESSAGE);
  assert.equal(profileErrorMessage("ERROR: NAME_NOT_ALLOWED (check_violation)"), NAME_NOT_ALLOWED_MESSAGE);
});

test("other errors pass through unchanged", () => {
  assert.equal(profileErrorMessage("You must be at least 18 years old to use this app"), "You must be at least 18 years old to use this app");
});
