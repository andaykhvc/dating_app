import { secretsMatch } from "./auth.ts";
import { buildPushData, type Target } from "./payload.ts";
import type { FcmClient } from "./fcm.ts";

export type Deps = {
  webhookSecret: string | undefined;
  fcm: FcmClient | null;
  getTargets(input: { kind: string; id: string; excludeUser: string | null }): Promise<Target[]>;
  deleteTokens(tokens: string[]): Promise<void>;
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/**
 * Webhook entry point: { kind: "message" | "match", id, exclude_user? } from the
 * database triggers. Who is notified is decided in SQL (get_push_targets); this
 * only formats and sends. Tokens FCM reports as unregistered are deleted.
 */
export async function handleRequest(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!secretsMatch(request.headers.get("x-webhook-secret"), deps.webhookSecret)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { kind?: unknown; id?: unknown; exclude_user?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if ((body.kind !== "message" && body.kind !== "match") || typeof body.id !== "string" || !/^[0-9a-f-]{1,40}$/i.test(body.id)) {
    return json({ error: "invalid payload" }, 400);
  }
  const excludeUser = typeof body.exclude_user === "string" ? body.exclude_user : null;

  if (!deps.fcm) return json({ error: "push not configured" }, 503);

  const targets = await deps.getTargets({ kind: body.kind, id: body.id, excludeUser });

  let sent = 0;
  const stale: string[] = [];
  let failed = 0;

  for (const target of targets) {
    const data = buildPushData(target);
    for (const token of target.tokens) {
      try {
        const result = await deps.fcm.send(token, data);
        if (result === "sent") sent++;
        else stale.push(token);
      } catch {
        failed++;
      }
    }
  }

  if (stale.length > 0) await deps.deleteTokens(stale);
  return json({ sent, removed: stale.length, failed });
}
