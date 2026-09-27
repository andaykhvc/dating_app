/**
 * npm test
 *
 * Unit tests for the content pipeline, on Node's built-in runner. The SQL
 * engine has its own end-to-end suite in supabase/tests/.
 *
 * Tatoeba and Wikidata tests use small SYNTHETIC fixtures written below —
 * invented sentences in the exports' file formats, not Tatoeba data.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanText, fold, norm, parseCell, tokenize } from "./lib/text.ts";
import { loadModel } from "./lib/model.ts";
import { loadBlocklist, summarize, validate } from "./lib/validate.ts";
import { deriveLessons, emitSql } from "./lib/build.ts";
import {
  buildCandidates, buildLexicon, estimateCefr, parseDetailed, parseIds, parseLinks,
  rejectReason, toTsv, type TatoebaSentence,
} from "./lib/tatoeba.ts";
import { analyse, parseDumpLine } from "./lib/wikidata.ts";

const CONTENT = join(import.meta.dirname, "../../content");

// ---------------------------------------------------------------------------
test("norm and fold mirror the database's learn_norm / learn_fold", () => {
  assert.equal(norm("¿Cómo estás?"), "cómo estás");
  assert.equal(norm("  DIE Straße!! "), "die straße");
  assert.equal(norm("Türkiye'de"), "türkiyede");
  assert.equal(fold("Straße"), "strasse");
  assert.equal(fold("İstanbul ÇAY ığdır"), "istanbul cay igdir");
  assert.notEqual(norm("sık"), norm("sik"), "Turkish dotless i is a different letter");
});

test("tokenize keeps one bare token per display token", () => {
  const { display, bare } = tokenize("¡Hola! ¿Cómo estás, María?");
  assert.deepEqual(display, ["¡Hola!", "¿Cómo", "estás,", "María?"]);
  assert.deepEqual(bare, ["Hola", "Cómo", "estás", "María"]);
  assert.deepEqual(tokenize("Mijn collega's zijn aardig.").bare, ["Mijn", "collega's", "zijn", "aardig"]);
});

test("parseCell reads the authoring syntax", () => {
  const cell = parseCell("Ich [trinke:verb] jeden Morgen Kaffee. | Ich trinke morgens Kaffee.");
  assert.equal(cell.text, "Ich trinke jeden Morgen Kaffee.");
  assert.equal(cell.focus, "trinke");
  assert.equal(cell.focusPos, "verb");
  assert.deepEqual(cell.alternatives, ["Ich trinke morgens Kaffee."]);
  assert.equal(parseCell("el agua {f}").gender, "f");
  assert.equal(cleanText("It’s  fine"), "It's fine");
});

// ---------------------------------------------------------------------------
test("the committed content validates with zero errors", () => {
  const model = loadModel(CONTENT);
  const { errors } = summarize(validate(model, loadBlocklist(model)));
  assert.deepEqual(errors, []);
});

test("every course language covers every editorial concept", () => {
  const model = loadModel(CONTENT);
  for (const [key, concept] of model.concepts) {
    if (concept.source !== "lingua-match-editorial") continue;
    for (const lang of ["de", "es", "nl", "tr", "en"]) {
      assert.ok(model.translations.get(key)?.get(lang), `${key} missing ${lang}`);
    }
  }
});

test("derived fields: noun gender, article-less answers, gaps, synonym groups", () => {
  const model = loadModel(CONTENT);
  const kaffee = model.translations.get("coffee")!.get("de")!;
  assert.equal(kaffee.gender, "m");
  assert.ok(kaffee.alternatives.includes("Kaffee"));

  const sentence = model.translations.get("s.coffee-every-morning")!.get("de")!;
  assert.equal(sentence.tokens[sentence.clozeIndex!], "trinke");
  assert.equal(sentence.clozePos, "verb");

  // "you" (informal) and "you" (formal) read the same in English.
  const informal = model.concepts.get("you-informal")!;
  assert.ok(informal.group && informal.group === model.concepts.get("you-formal")!.group);
});

test("lessons are derived with enough content and unique keys", () => {
  const model = loadModel(CONTENT);
  const lessons = deriveLessons(model);
  assert.ok(lessons.length >= 100, `only ${lessons.length} lessons`);
  assert.equal(new Set(lessons.map((l) => l.key)).size, lessons.length);
  for (const l of lessons) assert.ok(l.concepts.length >= 4, `${l.key} is too small`);
  const skills = new Set(model.curriculum.units.flatMap((u) => u.skills.map((s) => s.key)));
  for (const s of skills) assert.ok(lessons.some((l) => l.skill === s), `skill ${s} has no lessons`);
});

test("seed SQL escapes quotes and is deterministic", () => {
  const model = loadModel(CONTENT);
  const a = emitSql(model, deriveLessons(model));
  const b = emitSql(model, deriveLessons(model));
  assert.deepEqual(a, b);
  assert.match(a["0013_learn_translations_nl.sql"], /'Mijn collega''s zijn heel aardig\.'/);
});

// ---------------------------------------------------------------------------
function tempContent(mutate: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "lm-content-"));
  for (const f of ["languages.json", "sources.json", "curriculum.json", "blocklist.json"]) {
    cpSync(join(CONTENT, f), join(dir, f));
  }
  mkdirSync(join(dir, "concepts"));
  mutate(dir);
  return dir;
}

const HEADER = "key\tkind\tpos\tcefr\tskill\ttopic\ten\tde\tes\tnl\ttr\tsituation\tflags";

test("validation catches the mistakes it exists for", () => {
  const dir = tempContent((d) =>
    writeFileSync(join(d, "concepts", "bad.tsv"), [
      HEADER,
      // Missing Turkish, unknown skill.
      "tea\tw\tnoun\t\tnowhere\tdrinks\ttea\tder Tee\tel té\tde thee\t",
      // Too long for A1, no final punctuation, gap word not in the sentence.
      "s.long\ts\t\tA1\tdrinks\t\tI drink tea\tIch trinke jeden einzelnen Morgen um sieben Uhr einen [heißen Kaffee:noun]\tBebo [agua:noun].\tIk drink [thee:noun].\tÇay [içerim:verb].",
      // Blocked word, lower-case start, Spanish question without ¿.
      "s.bad\ts\t\tA1\tdrinks\t\tWhat?\twas scheiße?\tQué pasa?\tWat?\tNe?",
    ].join("\n")),
  );
  const model = loadModel(dir);
  const codes = new Set(validate(model, loadBlocklist(model)).filter((i) => i.level === "error").map((i) => i.code));
  for (const code of ["missing-translation", "unknown-skill", "too-long", "no-final-punctuation", "bad-focus", "blocklisted", "lowercase-start", "es-question-mark"]) {
    assert.ok(codes.has(code), `expected ${code}, got ${[...codes]}`);
  }
});

test("a source whose licence forbids commercial use cannot be enabled", () => {
  const dir = tempContent((d) => {
    const sources = JSON.parse(readFileSync(join(CONTENT, "sources.json"), "utf8"));
    sources.push({ ...sources[0], id: "nc-course", commercial_use_allowed: false, share_alike: true });
    writeFileSync(join(d, "sources.json"), JSON.stringify(sources));
  });
  const model = loadModel(dir);
  assert.ok(validate(model).some((i) => i.code === "unusable-license"));
});

// ---------------------------------------------------------------------------
test("Tatoeba: filters, CEFR estimate, topic mapping and attribution", () => {
  const model = loadModel(CONTENT);
  const lexicons = buildLexicon(model);
  const opts = { maxTokens: 10, maxChars: 70, blocklist: [], allowNames: false };

  const s = (id: string, lang: string, text: string): TatoebaSentence =>
    ({ id, lang, text, author: "someone", license: "CC BY 2.0 FR" });
  assert.equal(rejectReason(s("1", "en", "Tom drinks tea."), opts), "names");
  assert.equal(rejectReason(s("1", "es", "Qué hora es?"), opts), "es-question");
  assert.equal(rejectReason(s("1", "en", "It is 5 o'clock."), opts), "digits");
  assert.equal(rejectReason(s("1", "en", "Hello. How are you?"), opts), "multi-sentence");
  assert.equal(rejectReason(s("1", "en", "I drink tea with milk."), opts), null);

  assert.equal(estimateCefr(5, 0.9), "A1");
  assert.equal(estimateCefr(9, 0.65), "A2");
  assert.equal(estimateCefr(14, 1), null);

  // Synthetic exports in Tatoeba's column layout.
  const eng = parseDetailed("901\teng\tI drink tea with milk.\tuser_a\t\\N\t\\N\n902\teng\tThe quantum flux capacitor hums.\tuser_b\t\\N\t\\N\n", "en", new Set());
  const deu = parseDetailed("911\tdeu\tIch trinke Tee mit Milch.\tuser_c\t\\N\t\\N\n912\tdeu\tDer Quantenfluss summt.\t\\N\t\\N\t\\N\n", "de", parseIds("911\tdeu\tIch trinke Tee mit Milch.\t\\N\n"));
  const english = new Map(eng.map((x) => [x.id, x]));
  const links = parseLinks("901\t911\n902\t912\n", new Set(english.keys()));
  const { candidates, rejected } = buildCandidates({
    english,
    targets: { de: new Map(deu.map((x) => [x.id, x])) },
    links: { de: links },
    lexicons,
    requiredLangs: ["de"],
    existingFolds: {},
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].skill, "drinks");
  assert.equal(candidates[0].translations[0].license, "CC0 1.0", "CC0 subset detected by id");
  assert.equal(rejected["beyond-a2"], 1, "sentence outside the curriculum vocabulary is rejected");

  const { concepts, perLang } = toTsv(candidates, "needs_review");
  assert.match(concepts, /tatoeba-901\ts\t\tA1\tdrinks/);
  assert.match(perLang.de, /tatoeba-901\tIch trinke Tee mit Milch\.\t911\tuser_c\tCC0 1\.0\tneeds_review/);
});

test("Tatoeba output loads back into the model as reviewable, attributed rows", () => {
  const dir = tempContent((d) => {
    for (const f of ["a1-06-food-drink.tsv"]) cpSync(join(CONTENT, "concepts", f), join(d, "concepts", f));
    writeFileSync(join(d, "concepts", "tatoeba.tsv"), "#source: tatoeba\nkey\tkind\tpos\tcefr\tskill\ttopic\tsituation\tflags\ntatoeba-901\ts\t\tA1\tdrinks\t\t\tgloss=I drink tea with milk.; status=needs_review\n");
    for (const [lang, text] of [["en", "I drink tea with milk."], ["de", "Ich trinke Tee mit Milch."]]) {
      mkdirSync(join(d, lang));
      writeFileSync(join(d, lang, "tatoeba.tsv"), `#source: tatoeba\nkey\ttext\text_id\tauthor\tlicense\tstatus\ntatoeba-901\t${text}\t9${lang}\tuser_a\tCC BY 2.0 FR\tneeds_review\n`);
    }
  });
  const model = loadModel(dir);
  const concept = model.concepts.get("tatoeba-901")!;
  assert.equal(concept.status, "needs_review");
  assert.equal(concept.source, "tatoeba");
  const de = model.translations.get("tatoeba-901")!.get("de")!;
  assert.equal(de.author, "user_a");
  assert.equal(de.externalId, "9de");
  const errors = validate(model).filter((i) => i.level === "error" && i.message.includes("tatoeba-901"));
  assert.deepEqual(errors, []);
});

// ---------------------------------------------------------------------------
test("Wikidata: dump lines parse and genders are cross-checked", () => {
  const line = (id: string, lang: string, lemma: string, cat: string, gender: string | null, item: string) =>
    JSON.stringify({
      id, type: "lexeme", language: lang, lexicalCategory: cat,
      lemmas: { x: { value: lemma } },
      claims: gender ? { P5185: [{ mainsnak: { datavalue: { value: { id: gender } } } }] } : {},
      senses: [{ claims: { P5137: [{ mainsnak: { datavalue: { value: { id: item } } } }] } }],
    }) + ",";

  const lexemes = [
    // Synthetic: says German "Kaffee" is feminine, which contradicts our "der Kaffee".
    parseDumpLine(line("L1", "Q188", "Kaffee", "Q1084", "Q1775415", "Q8486")),
    parseDumpLine(line("L2", "Q1860", "coffee", "Q1084", null, "Q8486")),
    parseDumpLine(line("L3", "Q256", "kahve", "Q1084", null, "Q8486")),
    parseDumpLine("["),
  ].filter((l) => l !== null);
  assert.equal(lexemes.length, 3);

  const model = loadModel(CONTENT);
  const { genderIssues } = analyse(model, lexemes);
  assert.deepEqual(genderIssues.map((g) => [g.key, g.lang, g.ours, g.wikidata]), [["coffee", "de", "m", "f"]]);
});
