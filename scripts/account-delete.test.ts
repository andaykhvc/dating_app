import { test } from "node:test";
import assert from "node:assert/strict";
import { isDeleteConfirmed, isSameOrigin } from "../src/lib/account-delete.ts";

test("only the exact confirmation word confirms", () => {
  assert.equal(isDeleteConfirmed({ confirm: "DELETE" }), true);
  assert.equal(isDeleteConfirmed({ confirm: "delete" }), false);
  assert.equal(isDeleteConfirmed({ confirm: "" }), false);
  assert.equal(isDeleteConfirmed({}), false);
  assert.equal(isDeleteConfirmed(null), false);
  assert.equal(isDeleteConfirmed("DELETE"), false);
});

test("a request from another site is not same-origin", () => {
  assert.equal(isSameOrigin("https://app.example.com", "app.example.com"), true);
  assert.equal(isSameOrigin("http://localhost:3000", "localhost:3000"), true);
  assert.equal(isSameOrigin("https://evil.example", "app.example.com"), false);
  assert.equal(isSameOrigin("https://app.example.com.evil.example", "app.example.com"), false);
  assert.equal(isSameOrigin(null, "app.example.com"), false);
  assert.equal(isSameOrigin("https://app.example.com", null), false);
  assert.equal(isSameOrigin("not a url", "app.example.com"), false);
});
