/**
 * Firebase web config. All values are public by design (they ship to every
 * browser) and come from NEXT_PUBLIC_* variables, so they are read once at
 * build time. Any missing value means push is not configured: the feature hides
 * itself and nothing is loaded.
 */
export type FirebaseWebConfig = {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
};

export function readFirebaseConfig(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  },
): FirebaseWebConfig | null {
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const messagingSenderId = env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  const vapidKey = env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) return null;
  return { apiKey, projectId, messagingSenderId, appId, vapidKey };
}

export const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

/**
 * The service worker is a static file with no access to process.env, so the
 * (public) config travels in its URL when it is registered and the worker reads
 * it from self.location.search.
 */
export function serviceWorkerUrl(config: FirebaseWebConfig): string {
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });
  return `${SERVICE_WORKER_PATH}?${params.toString()}`;
}
