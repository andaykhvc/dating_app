import { test } from "node:test";
import assert from "node:assert/strict";
import { secretsMatch } from "./auth.ts";
import { handleRequest, type Deps, type PhotoRow } from "./handler.ts";
import { signRequest } from "./providers/sigv4.ts";
import { verdictFromLabels } from "./verdict.ts";
import type { ModerationMode, ModerationProvider, ModerationResult } from "./types.ts";

// --- verdict mapping ------------------------------------------------------------------

test("clearly safe photos (including swimwear) are approved", () => {
  assert.equal(verdictFromLabels([]).verdict, "safe");
  const swimwear = verdictFromLabels([
    { Name: "Suggestive", Confidence: 97, TaxonomyLevel: 1 },
    { Name: "Swimwear or Underwear", ParentName: "Suggestive", Confidence: 97, TaxonomyLevel: 2 },
  ]);
  assert.equal(swimwear.verdict, "safe");
});

test("explicit nudity above the reject threshold is rejected, via parent lookup", () => {
  const result = verdictFromLabels([
    { Name: "Explicit Nudity", Confidence: 92, TaxonomyLevel: 1 },
    { Name: "Exposed Female Nipple", ParentName: "Explicit Nudity", Confidence: 92, TaxonomyLevel: 2 },
  ]);
  assert.equal(result.verdict, "unsafe");
  assert.equal(result.reason, "Nudity or sexual content");
  assert.deepEqual(result.labels, ["Explicit Nudity"]);
});

test("a child label alone still counts towards its top-level category", () => {
  const result = verdictFromLabels([
    { Name: "Exposed Genitalia", ParentName: "Explicit Nudity", Confidence: 90, TaxonomyLevel: 2 },
  ]);
  assert.equal(result.verdict, "unsafe");
});

test("in-between scores wait for a person", () => {
  assert.equal(verdictFromLabels([{ Name: "Explicit Nudity", Confidence: 60, TaxonomyLevel: 1 }]).verdict, "review");
  assert.equal(
    verdictFromLabels([{ Name: "Non-Explicit Nudity of Intimate parts and Kissing", Confidence: 75, TaxonomyLevel: 1 }]).verdict,
    "review",
  );
});

test("low-confidence labels are ignored", () => {
  assert.equal(verdictFromLabels([{ Name: "Explicit Nudity", Confidence: 20, TaxonomyLevel: 1 }]).verdict, "safe");
});

test("malformed provider responses are never 'safe'", () => {
  for (const bad of [undefined, null, "oops", {}, [{ Name: 5, Confidence: 99 }], [{ Name: "Explicit Nudity" }], [null]]) {
    assert.equal(verdictFromLabels(bad).verdict, "review", JSON.stringify(bad));
  }
});

// --- webhook auth ---------------------------------------------------------------------------

test("secrets compare exactly; missing values never match", () => {
  assert.equal(secretsMatch("s3cret", "s3cret"), true);
  assert.equal(secretsMatch("s3cret", "s3cre"), false);
  assert.equal(secretsMatch("", ""), false);
  assert.equal(secretsMatch(null, "x"), false);
  assert.equal(secretsMatch("x", undefined), false);
});

// --- SigV4 against AWS's published "get-vanilla" test vector --------------------------------

test("SigV4 signing matches the AWS test suite", async () => {
  const headers = await signRequest({
    method: "GET",
    host: "example.amazonaws.com",
    path: "/",
    body: "",
    region: "us-east-1",
    service: "service",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    now: new Date("2015-08-30T12:36:00Z"),
  });
  assert.equal(
    headers.Authorization,
    "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, " +
      "SignedHeaders=host;x-amz-date, " +
      "Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
  );
});

// --- handler --------------------------------------------------------------------------------------

const PHOTO_ID = "11111111-1111-1111-1111-111111111111";
const SECRET = "test-secret";

function fakeProvider(result: ModerationResult | Error): ModerationProvider & { calls: number } {
  return {
    name: "fake",
    calls: 0,
    async moderate() {
      this.calls++;
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

function setup(over: Partial<Deps> & { mode?: ModerationMode; photo?: Partial<PhotoRow> | null; result?: ModerationResult | Error } = {}) {
  const calls = { approve: 0, reject: 0, removeFiles: 0, logs: [] as Array<Record<string, unknown>> };
  const provider = fakeProvider(over.result ?? { verdict: "safe", labels: [], scores: {} });
  const photo: PhotoRow | null =
    over.photo === null
      ? null
      : { id: PHOTO_ID, user_id: "u1", storage_path: "u1/a.webp", moderation_status: "pending", ...over.photo };
  const deps: Deps = {
    mode: over.mode ?? "enforce",
    webhookSecret: SECRET,
    provider,
    getPhoto: async () => photo,
    download: async () => new Uint8Array([1, 2, 3]),
    countRecentCalls: async () => 0,
    approve: async () => (calls.approve++, true),
    reject: async () => (calls.reject++, true),
    removeFiles: async () => void calls.removeFiles++,
    log: async (e) => void calls.logs.push(e),
    ...over,
  };
  return { deps, calls, provider };
}

function request(opts: { secret?: string | null; method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret !== null) headers["x-webhook-secret"] = opts.secret ?? SECRET;
  return new Request("https://example.test/", {
    method: opts.method ?? "POST",
    headers,
    body: opts.method === "GET" ? undefined : JSON.stringify(opts.body ?? { photo_id: PHOTO_ID }),
  });
}

async function outcome(res: Response) {
  return ((await res.json()) as { outcome?: string }).outcome;
}

test("missing or wrong secret is 401 and does nothing", async () => {
  const { deps, calls, provider } = setup();
  assert.equal((await handleRequest(request({ secret: null }), deps)).status, 401);
  assert.equal((await handleRequest(request({ secret: "nope" }), deps)).status, 401);
  assert.equal(provider.calls, 0);
  assert.equal(calls.approve + calls.reject, 0);
});

test("only POST is accepted", async () => {
  const { deps } = setup();
  assert.equal((await handleRequest(request({ method: "GET" }), deps)).status, 405);
});

test("mode off leaves everything manual", async () => {
  const { deps, calls, provider } = setup({ mode: "off" });
  assert.equal(await outcome(await handleRequest(request(), deps)), "off");
  assert.equal(provider.calls, 0);
  assert.equal(calls.approve + calls.reject, 0);
});

test("shadow mode logs what it would do without changing status", async () => {
  const { deps, calls } = setup({
    mode: "shadow",
    result: { verdict: "unsafe", reason: "Nudity or sexual content", labels: ["Explicit Nudity"], scores: { "Explicit Nudity": 95 } },
  });
  assert.equal(await outcome(await handleRequest(request(), deps)), "shadow");
  assert.equal(calls.approve + calls.reject + calls.removeFiles, 0);
  assert.equal(calls.logs[0].verdict, "unsafe");
  assert.equal(calls.logs[0].outcome, "shadow");
});

test("enforce: safe is approved", async () => {
  const { deps, calls } = setup();
  assert.equal(await outcome(await handleRequest(request(), deps)), "approved");
  assert.equal(calls.approve, 1);
});

test("enforce: unsafe is rejected and its files are deleted", async () => {
  const { deps, calls } = setup({
    result: { verdict: "unsafe", reason: "Nudity or sexual content", labels: [], scores: {} },
  });
  assert.equal(await outcome(await handleRequest(request(), deps)), "rejected");
  assert.equal(calls.reject, 1);
  assert.equal(calls.removeFiles, 1);
});

test("enforce: borderline stays pending", async () => {
  const { deps, calls } = setup({ result: { verdict: "review", labels: [], scores: {} } });
  assert.equal(await outcome(await handleRequest(request(), deps)), "pending");
  assert.equal(calls.approve + calls.reject, 0);
});

test("provider error fails closed: stays pending, never approved", async () => {
  const { deps, calls } = setup({ result: new Error("boom") });
  assert.equal(await outcome(await handleRequest(request(), deps)), "pending");
  assert.equal(calls.approve, 0);
  assert.equal(calls.logs[0].outcome, "error");
});

test("a missing provider (no API key) fails closed", async () => {
  const { deps, calls } = setup({ provider: null });
  assert.equal(await outcome(await handleRequest(request(), deps)), "pending");
  assert.equal(calls.approve, 0);
});

test("a photo that is already decided is left alone (duplicate webhook)", async () => {
  const { deps, calls, provider } = setup({ photo: { moderation_status: "approved" } });
  assert.equal(await outcome(await handleRequest(request(), deps)), "already_decided");
  assert.equal(provider.calls, 0);
  assert.equal(calls.approve + calls.reject, 0);
});

test("losing the race to a human does not remove files", async () => {
  const { deps, calls } = setup({
    result: { verdict: "unsafe", reason: "x", labels: [], scores: {} },
    reject: async () => false,
  });
  assert.equal(await outcome(await handleRequest(request(), deps)), "already_decided");
  assert.equal(calls.removeFiles, 0);
});

test("over the daily cap the provider is not called and the photo stays pending", async () => {
  const { deps, provider } = setup({ countRecentCalls: async () => 20 });
  assert.equal(await outcome(await handleRequest(request(), deps)), "capped");
  assert.equal(provider.calls, 0);
});

test("oversized files are not sent to the provider", async () => {
  const { deps, provider } = setup({ download: async () => new Uint8Array(3 * 1024 * 1024) });
  assert.equal(await outcome(await handleRequest(request(), deps)), "pending");
  assert.equal(provider.calls, 0);
});

test("a malformed body is rejected before any work", async () => {
  const { deps, provider } = setup();
  assert.equal((await handleRequest(request({ body: { photo_id: "../../etc" } }), deps)).status, 400);
  assert.equal(provider.calls, 0);
});
