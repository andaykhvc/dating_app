import { test } from "node:test";
import assert from "node:assert/strict";
import { createInstallStore } from "../src/features/install/install-store.ts";

function browser(userAgent = "Android Chrome", maxTouchPoints = 0, standalone = false) {
  const events = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: standalone });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.assign(events, { matchMedia: () => media }),
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent, maxTouchPoints, standalone },
  });
  return { events, media };
}

function offer(events: EventTarget, prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>) {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt });
  events.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
}

test("detects iPhone, desktop-mode iPad, Android and desktop browsers", () => {
  for (const [agent, touch, expected] of [
    ["iPhone Safari", 5, "ios"],
    ["Mozilla Macintosh Safari", 5, "ios"],
    ["Mozilla Macintosh Safari", 0, "desktop"],
    ["Android Chrome", 5, "android"],
  ] as const) {
    browser(agent, touch);
    const store = createInstallStore();
    const unsubscribe = store.subscribe(() => {});
    assert.equal(store.getSnapshot().platform, expected);
    unsubscribe();
  }
});

test("retains a prompt across subscribers and consumes it only once after dismissal", async () => {
  const { events } = browser();
  const store = createInstallStore();
  const unsubscribe = store.subscribe(() => {});
  let calls = 0;
  offer(events, async () => { calls++; return { outcome: "dismissed" }; });
  const leaveScreen = store.subscribe(() => {});
  leaveScreen();
  assert.equal(store.getSnapshot().canInstall, true);
  await Promise.all([store.install(), store.install()]);
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().status, "dismissed");
  assert.equal(store.getSnapshot().canInstall, false);
  assert.equal(store.getSnapshot().installed, false);
  offer(events, async () => ({ outcome: "accepted" }));
  assert.equal(store.getSnapshot().canInstall, true);
  await store.install();
  assert.equal(store.getSnapshot().status, "accepted");
  // Accepting the offer is not confirmation that installation completed.
  assert.equal(store.getSnapshot().installed, false);
  events.dispatchEvent(new Event("appinstalled"));
  assert.equal(store.getSnapshot().installed, true);
  assert.equal(store.getSnapshot().canInstall, false);
  unsubscribe();
});

test("failed prompts allow manual installation without reusing the event", async () => {
  const { events } = browser();
  const store = createInstallStore();
  const unsubscribe = store.subscribe(() => {});
  offer(events, async () => { throw new Error("Browser refused"); });
  await store.install();
  assert.equal(store.getSnapshot().status, "error");
  assert.equal(store.getSnapshot().canInstall, false);
  assert.equal(store.getSnapshot().installed, false);
  unsubscribe();
});

test("detects installed display modes and cleans up browser listeners", () => {
  const { events, media } = browser();
  const store = createInstallStore();
  let updates = 0;
  const unsubscribe = store.subscribe(() => { updates++; });
  media.matches = true;
  media.dispatchEvent(new Event("change"));
  assert.equal(store.getSnapshot().installed, true);
  unsubscribe();
  const previousUpdates = updates;
  events.dispatchEvent(new Event("appinstalled"));
  assert.equal(updates, previousUpdates);

  browser("iPhone Safari", 5, true);
  const iosStore = createInstallStore();
  const cleanup = iosStore.subscribe(() => {});
  assert.equal(iosStore.getSnapshot().installed, true);
  cleanup();
});

test("an install event while the prompt is pending stays installed when it settles", async () => {
  const { events } = browser();
  const store = createInstallStore();
  const unsubscribe = store.subscribe(() => {});
  let settle!: (choice: { outcome: "accepted" }) => void;
  offer(events, () => new Promise((resolve) => { settle = resolve; }));
  const installing = store.install();
  assert.equal(store.getSnapshot().status, "prompting");
  events.dispatchEvent(new Event("appinstalled"));
  settle({ outcome: "accepted" });
  await installing;
  assert.equal(store.getSnapshot().installed, true);
  assert.equal(store.getSnapshot().status, "idle");
  unsubscribe();
});
