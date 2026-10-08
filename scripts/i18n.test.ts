import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  parseAcceptLanguage,
  resolveLocale,
} from "../src/i18n/config.ts";
import { createTranslator, mergeMessages, flattenMessages } from "../src/i18n/translate.ts";
import { checkMessages } from "./i18n-check.mjs";

test("Accept-Language is ordered by quality", () => {
  assert.deepEqual(parseAcceptLanguage("de;q=0.5, tr-TR,tr;q=0.9, en;q=0.4"), ["tr", "tr", "de", "en"]);
  assert.deepEqual(parseAcceptLanguage("*;q=0.5,fr"), ["fr"]);
  assert.deepEqual(parseAcceptLanguage(null), []);
});

test("locale: cookie, then account, then browser, then English", () => {
  assert.equal(resolveLocale({ cookie: "tr", profile: "en", acceptLanguage: "en" }), "tr");
  assert.equal(resolveLocale({ cookie: null, profile: "tr", acceptLanguage: "en" }), "tr");
  assert.equal(resolveLocale({ acceptLanguage: "tr-TR,tr;q=0.9,en;q=0.8" }), "tr");
  assert.equal(resolveLocale({ acceptLanguage: "fr-FR,fr;q=0.9,tr;q=0.5" }), "tr");
  assert.equal(resolveLocale({ acceptLanguage: "fr-FR" }), DEFAULT_LOCALE);
  assert.equal(resolveLocale({ cookie: "xx", profile: "yy" }), DEFAULT_LOCALE);
  assert.equal(resolveLocale({}), DEFAULT_LOCALE);
});

const en = { nav: { home: "Home" }, hello: "Hello {name}", inbox: { unread_one: "{count} unread", unread_other: "{count} unread messages" } };
const tr = { nav: {}, hello: "Merhaba {name}", inbox: { unread_one: "{count} okunmamış", unread_other: "{count} okunmamış mesaj" } };

test("interpolation fills {name} and leaves unknown placeholders", () => {
  const t = createTranslator(en, "en");
  assert.equal(t("hello", { name: "Ada" }), "Hello Ada");
  assert.equal(t("hello"), "Hello {name}");
});

test("plural forms follow Intl.PluralRules", () => {
  const t = createTranslator(en, "en");
  assert.equal(t("inbox.unread", { count: 1 }), "1 unread");
  assert.equal(t("inbox.unread", { count: 5 }), "5 unread messages");
  const tt = createTranslator(tr, "tr");
  assert.equal(tt("inbox.unread", { count: 1 }), "1 okunmamış");
  assert.equal(tt("inbox.unread", { count: 0 }), "0 okunmamış mesaj");
});

test("a missing key falls back to English when merged, and never throws", () => {
  const merged = mergeMessages(en, tr);
  const t = createTranslator(merged, "tr");
  assert.equal(t("nav.home"), "Home");
  assert.equal(t("hello", { name: "Ada" }), "Merhaba Ada");
  assert.equal(t("does.not.exist"), "does.not.exist");
});

test("flattenMessages produces dotted keys", () => {
  assert.deepEqual(flattenMessages({ a: { b: "x" }, c: "y" }), { "a.b": "x", c: "y" });
});

test("i18n:check finds missing, extra and mismatched keys", () => {
  assert.deepEqual(checkMessages(en, tr, "tr.json"), ["tr.json: missing key \"nav.home\""]);
  const broken = { hello: "Merhaba {isim}", extra: "x", nav: { home: "Ev" }, inbox: { unread_one: "{count}", unread_other: "{count}" } };
  const problems = checkMessages(en, broken, "tr.json");
  assert.ok(problems.some((p) => p.includes('extra key "extra"')));
  assert.ok(problems.some((p) => p.includes('"hello" placeholders differ')));
  assert.ok(!problems.some((p) => p.includes("missing key")));
});

test("the shipped translation files match en.json", async () => {
  const { checkDirectory } = await import("./i18n-check.mjs");
  const { problems } = checkDirectory(new URL("../src/i18n/messages/", import.meta.url));
  assert.deepEqual(problems, []);
});
