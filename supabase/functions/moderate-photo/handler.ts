import { secretsMatch } from "./auth.ts";
import { MAX_CALLS_PER_USER_PER_DAY, MAX_IMAGE_BYTES } from "./thresholds.ts";
import type { ModerationMode, ModerationProvider, ModerationResult } from "./types.ts";

export type PhotoRow = {
  id: string;
  user_id: string;
  storage_path: string;
  moderation_status: "pending" | "approved" | "rejected";
};

/** Everything the handler needs from the outside world, so tests can fake it. */
export type Deps = {
  mode: ModerationMode;
  webhookSecret: string | undefined;
  provider: ModerationProvider | null;
  getPhoto(photoId: string): Promise<PhotoRow | null>;
  download(path: string): Promise<Uint8Array | null>;
  /** Provider calls made for this user in the last 24 hours. */
  countRecentCalls(userId: string): Promise<number>;
  approve(photoId: string): Promise<boolean>;
  /** Returns false when the photo was no longer pending. */
  reject(photoId: string, reason: string): Promise<boolean>;
  removeFiles(path: string): Promise<void>;
  log(event: {
    photo_id: string;
    user_id: string;
    mode: ModerationMode;
    outcome: string;
    verdict?: string;
    labels?: string[];
    scores?: Record<string, number>;
    error?: string;
  }): Promise<void>;
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Webhook entry point. Fail closed: any problem leaves the photo pending for a
 * human; nothing here ever approves on error. Image bytes and ids are never
 * written to the console.
 */
export async function handleRequest(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!secretsMatch(request.headers.get("x-webhook-secret"), deps.webhookSecret)) {
    return json({ error: "unauthorized" }, 401);
  }
  if (deps.mode === "off") return json({ outcome: "off" });

  let photoId: unknown;
  try {
    photoId = ((await request.json()) as { photo_id?: unknown }).photo_id;
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (typeof photoId !== "string" || !/^[0-9a-f-]{36}$/i.test(photoId)) {
    return json({ error: "invalid photo_id" }, 400);
  }

  const photo = await deps.getPhoto(photoId);
  if (!photo) return json({ outcome: "not_found" });
  // The webhook can fire twice, and a human may already have decided.
  if (photo.moderation_status !== "pending") return json({ outcome: "already_decided" });

  const base = { photo_id: photo.id, user_id: photo.user_id, mode: deps.mode };

  if ((await deps.countRecentCalls(photo.user_id)) >= MAX_CALLS_PER_USER_PER_DAY) {
    await deps.log({ ...base, outcome: "capped" });
    return json({ outcome: "capped" });
  }

  if (!deps.provider) {
    await deps.log({ ...base, outcome: "error", error: "provider not configured" });
    return json({ outcome: "pending" });
  }

  let result: ModerationResult;
  try {
    const bytes = await deps.download(photo.storage_path);
    if (!bytes) {
      await deps.log({ ...base, outcome: "error", error: "file not found" });
      return json({ outcome: "pending" });
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      await deps.log({ ...base, outcome: "too_large" });
      return json({ outcome: "pending" });
    }
    result = await deps.provider.moderate(bytes);
  } catch (e) {
    await deps.log({
      ...base,
      outcome: "error",
      error: e instanceof Error ? e.message.slice(0, 200) : "unknown error",
    });
    return json({ outcome: "pending" });
  }

  const detail = { verdict: result.verdict, labels: result.labels, scores: result.scores };

  if (deps.mode === "shadow") {
    await deps.log({ ...base, ...detail, outcome: "shadow" });
    return json({ outcome: "shadow", verdict: result.verdict });
  }

  // enforce
  if (result.verdict === "safe") {
    const done = await deps.approve(photo.id);
    await deps.log({ ...base, ...detail, outcome: done ? "approved" : "already_decided" });
    return json({ outcome: done ? "approved" : "already_decided" });
  }
  if (result.verdict === "unsafe") {
    const done = await deps.reject(photo.id, result.reason ?? "Not allowed");
    if (done) await deps.removeFiles(photo.storage_path);
    await deps.log({ ...base, ...detail, outcome: done ? "rejected" : "already_decided" });
    return json({ outcome: done ? "rejected" : "already_decided" });
  }

  await deps.log({ ...base, ...detail, outcome: "left_for_review" });
  return json({ outcome: "pending" });
}
