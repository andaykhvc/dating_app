// Service worker for web push (Firebase Cloud Messaging).
//
// It shows the notification itself from the standard `push` event, so it needs
// no Firebase library. FCM delivers { notification?, data? } as JSON; the
// sender (#24) uses data-only messages: data.title, data.body, data.url.
//
// The Firebase web config is not needed to receive pushes, but it travels in the
// registration URL (?apiKey=...) so the page and worker stay in step; see
// src/features/push/config.ts.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "Lingua Match";
  const options = {
    body: notification.body || data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // One notification per conversation replaces the previous one.
    tag: data.tag || data.url || undefined,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Only same-site paths: a push payload must never open another site.
  const raw = (event.notification.data && event.notification.data.url) || "/";
  const target = new URL(raw, self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin + "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          if ("navigate" in client) client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
