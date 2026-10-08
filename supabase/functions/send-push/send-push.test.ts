import { test } from "node:test";
import assert from "node:assert/strict";
import { createFcmClient, createSignedJwt, parseServiceAccount } from "./fcm.ts";
import { handleRequest, type Deps } from "./handler.ts";
import { buildPushData, type Target } from "./payload.ts";

const SECRET = "push-secret";

// --- payloads --------------------------------------------------------------------------

test("message pushes are generic: first name + fixed sentence, no content", () => {
  const data = buildPushData({ kind: "message", match_id: "m1", sender_first_name: "Alice" });
  assert.deepEqual(data, { title: "Alice", body: "Sent you a message", url: "/messages/m1", tag: "chat-m1" });
});

test("match pushes use the fixed sentence and link to the chat", () => {
  const data = buildPushData({ kind: "match", match_id: "m2", sender_first_name: null });
  assert.equal(data.body, "You have a new language partner");
  assert.equal(data.url, "/messages/m2");
});

test("a missing or very long name never breaks the title", () => {
  assert.equal(buildPushData({ kind: "message", match_id: "m", sender_first_name: null }).title, "Lingua Match");
  assert.equal(buildPushData({ kind: "message", match_id: "m", sender_first_name: "x".repeat(200) }).title.length, 40);
});

// --- FCM auth -------------------------------------------------------------------------------

async function testAccount() {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  let binary = "";
  for (const b of der) binary += String.fromCharCode(b);
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(binary).match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
  return { pair, account: { project_id: "proj", client_email: "sa@proj.iam.gserviceaccount.com", private_key: pem } };
}

test("the service-account JWT has the right claims and a valid RS256 signature", async () => {
  const { pair, account } = await testAccount();
  const jwt = await createSignedJwt(account, new Date("2026-01-01T00:00:00Z"));
  const [header, claims, signature] = jwt.split(".");
  const decode = (s: string) => JSON.parse(Buffer.from(s, "base64url").toString());
  assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
  const c = decode(claims);
  assert.equal(c.iss, account.client_email);
  assert.equal(c.scope, "https://www.googleapis.com/auth/firebase.messaging");
  assert.equal(c.aud, "https://oauth2.googleapis.com/token");
  assert.equal(c.exp - c.iat, 3600);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    pair.publicKey,
    Buffer.from(signature, "base64url"),
    new TextEncoder().encode(`${header}.${claims}`),
  );
  assert.equal(ok, true);
});

test("service account parsing rejects incomplete or invalid JSON", () => {
  assert.equal(parseServiceAccount(undefined), null);
  assert.equal(parseServiceAccount("{not json"), null);
  assert.equal(parseServiceAccount(JSON.stringify({ project_id: "p" })), null);
});

test("FCM client: sends data-only with a bearer token, caches the token, maps UNREGISTERED", async () => {
  const { account } = await testAccount();
  const calls: Array<{ url: string; body: string; auth?: string }> = [];
  const fetchFake = (async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    calls.push({ url, body: String(init.body), auth: headers.authorization });
    if (url.includes("oauth2")) {
      return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
    }
    if (String(init.body).includes("dead-token")) {
      return new Response(
        JSON.stringify({ error: { status: "NOT_FOUND", details: [{ errorCode: "UNREGISTERED" }] } }),
        { status: 404 },
      );
    }
    if (String(init.body).includes("broken-token")) return new Response("{}", { status: 500 });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;

  const client = createFcmClient(account, fetchFake);
  assert.equal(await client.send("good-token", { title: "t", body: "b", url: "/x", tag: "x" }), "sent");
  assert.equal(await client.send("dead-token", { title: "t" } as never), "unregistered");
  await assert.rejects(client.send("broken-token", { title: "t" } as never), /fcm send failed \(500\)/);

  assert.equal(calls.filter((c) => c.url.includes("oauth2")).length, 1, "the OAuth token is cached");
  const send = calls.find((c) => c.url.includes("messages:send"))!;
  assert.equal(send.auth, "Bearer tok");
  const message = JSON.parse(send.body).message;
  assert.equal(message.token, "good-token");
  assert.equal(message.notification, undefined, "data-only message");
  assert.equal(message.data.body, "b");
});

// --- handler ---------------------------------------------------------------------------------

function setup(over: Partial<Deps> & { targets?: Target[]; sendResult?: (token: string) => "sent" | "unregistered" | Error } = {}) {
  const sentTo: Array<{ token: string; data: Record<string, string> }> = [];
  const deleted: string[][] = [];
  const targets = over.targets ?? [
    { user_id: "u2", kind: "message" as const, match_id: "m1", sender_first_name: "Alice", tokens: ["t1", "t2"] },
  ];
  const deps: Deps = {
    webhookSecret: SECRET,
    fcm: {
      async send(token, data) {
        const r = over.sendResult?.(token) ?? "sent";
        if (r instanceof Error) throw r;
        sentTo.push({ token, data });
        return r;
      },
    },
    getTargets: async () => targets,
    deleteTokens: async (t) => void deleted.push(t),
    ...over,
  };
  return { deps, sentTo, deleted };
}

function req(opts: { secret?: string | null; body?: unknown; method?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret !== null) headers["x-webhook-secret"] = opts.secret ?? SECRET;
  return new Request("https://x.test/", {
    method: opts.method ?? "POST",
    headers,
    body: opts.method === "GET" ? undefined : JSON.stringify(opts.body ?? { kind: "message", id: "12" }),
  });
}

test("calls without the shared secret are rejected and send nothing", async () => {
  const { deps, sentTo } = setup();
  assert.equal((await handleRequest(req({ secret: null }), deps)).status, 401);
  assert.equal((await handleRequest(req({ secret: "wrong" }), deps)).status, 401);
  assert.equal((await handleRequest(req({ method: "GET" }), deps)).status, 405);
  assert.equal(sentTo.length, 0);
});

test("a message push goes to each of the recipient's tokens with generic text", async () => {
  const { deps, sentTo } = setup();
  const res = await handleRequest(req(), deps);
  assert.deepEqual(await res.json(), { sent: 2, removed: 0, failed: 0 });
  assert.deepEqual(sentTo.map((s) => s.token), ["t1", "t2"]);
  assert.equal(sentTo[0].data.body, "Sent you a message");
  assert.equal(sentTo[0].data.url, "/messages/m1");
  assert.ok(!JSON.stringify(sentTo).includes("SECRET"));
});

test("no targets (sender, blocked, ended match) means nothing is sent", async () => {
  const { deps, sentTo } = setup({ targets: [] });
  assert.deepEqual(await (await handleRequest(req(), deps)).json(), { sent: 0, removed: 0, failed: 0 });
  assert.equal(sentTo.length, 0);
});

test("tokens FCM reports as unregistered are deleted", async () => {
  const { deps, deleted } = setup({ sendResult: (t) => (t === "t2" ? "unregistered" : "sent") });
  assert.deepEqual(await (await handleRequest(req(), deps)).json(), { sent: 1, removed: 1, failed: 0 });
  assert.deepEqual(deleted, [["t2"]]);
});

test("one failing token does not stop the others", async () => {
  const { deps, sentTo } = setup({ sendResult: (t) => (t === "t1" ? new Error("boom") : "sent") });
  assert.deepEqual(await (await handleRequest(req(), deps)).json(), { sent: 1, removed: 0, failed: 1 });
  assert.deepEqual(sentTo.map((s) => s.token), ["t2"]);
});

test("exclude_user and kind are passed to the database decision", async () => {
  let seen: unknown;
  const { deps } = setup({ getTargets: async (i) => ((seen = i), []) });
  await handleRequest(req({ body: { kind: "match", id: "abc-123", exclude_user: "u9" } }), deps);
  assert.deepEqual(seen, { kind: "match", id: "abc-123", excludeUser: "u9" });
});

test("bad payloads and a missing FCM key are refused", async () => {
  const { deps } = setup();
  assert.equal((await handleRequest(req({ body: { kind: "other", id: "1" } }), deps)).status, 400);
  assert.equal((await handleRequest(req({ body: { kind: "message", id: "1; drop table" } }), deps)).status, 400);
  assert.equal((await handleRequest(req(), { ...deps, fcm: null })).status, 503);
});
