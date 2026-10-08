import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSiteUrl, siteUrl } from "../src/lib/site.ts";

test("normalizes to a bare http(s) origin", () => {
  assert.equal(normalizeSiteUrl("https://example.com/"), "https://example.com");
  assert.equal(normalizeSiteUrl(" https://example.com/app?x=1 "), "https://example.com");
  assert.equal(normalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");
});

test("rejects empty, malformed and non-http values", () => {
  assert.equal(normalizeSiteUrl(undefined), null);
  assert.equal(normalizeSiteUrl(""), null);
  assert.equal(normalizeSiteUrl("example.com"), null);
  assert.equal(normalizeSiteUrl("javascript:alert(1)"), null);
});

test("env var wins, then the request origin, then localhost", () => {
  const saved = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(siteUrl(), "http://localhost:3000");
    assert.equal(siteUrl("https://preview.example.com"), "https://preview.example.com");
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.example.com/";
    assert.equal(siteUrl("https://preview.example.com"), "https://www.example.com");
    process.env.NEXT_PUBLIC_SITE_URL = "not a url";
    assert.equal(siteUrl("https://preview.example.com"), "https://preview.example.com");
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = saved;
  }
});
