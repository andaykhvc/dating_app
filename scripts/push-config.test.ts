import { test } from "node:test";
import assert from "node:assert/strict";
import { readFirebaseConfig, serviceWorkerUrl } from "../src/features/push/config.ts";

const full = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "key",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "proj",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: "vapid",
};

test("push is configured only when every variable is set", () => {
  assert.deepEqual(readFirebaseConfig(full), {
    apiKey: "key",
    projectId: "proj",
    messagingSenderId: "123",
    appId: "1:123:web:abc",
    vapidKey: "vapid",
  });
  assert.equal(readFirebaseConfig({}), null);
  for (const key of Object.keys(full)) {
    assert.equal(readFirebaseConfig({ ...full, [key]: undefined }), null, key);
    assert.equal(readFirebaseConfig({ ...full, [key]: "  " }), null, `${key} blank`);
  }
});

test("the service worker URL carries the public config, never the VAPID key", () => {
  const url = serviceWorkerUrl(readFirebaseConfig(full)!);
  assert.ok(url.startsWith("/firebase-messaging-sw.js?"));
  const params = new URL(url, "https://x.test").searchParams;
  assert.equal(params.get("projectId"), "proj");
  assert.equal(params.has("vapidKey"), false);
});
