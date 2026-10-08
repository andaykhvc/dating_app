// Supabase Edge Function (Deno). Wires the real services into handler.ts.
// Secrets (set with `supabase secrets set`, never committed):
//   FCM_SERVICE_ACCOUNT_JSON   the Firebase service-account key (whole JSON)
//   PUSH_WEBHOOK_SECRET        shared secret the database triggers send
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createFcmClient, parseServiceAccount } from "./fcm.ts";
import { handleRequest, type Deps } from "./handler.ts";
import type { Target } from "./payload.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const account = parseServiceAccount(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON"));
// Created once per instance so the OAuth token is cached between calls.
const fcm = account ? createFcmClient(account) : null;

function deps(): Deps {
  return {
    webhookSecret: Deno.env.get("PUSH_WEBHOOK_SECRET"),
    fcm,
    async getTargets({ kind, id, excludeUser }) {
      const { data, error } = await admin.rpc("get_push_targets", {
        p_kind: kind,
        p_id: id,
        p_exclude_user: excludeUser,
      });
      if (error) throw new Error(`get_push_targets: ${error.message}`);
      return ((data as { targets?: Target[] } | null)?.targets ?? []) as Target[];
    },
    async deleteTokens(tokens) {
      await admin.from("push_tokens").delete().in("token", tokens);
    },
  };
}

Deno.serve((request) => handleRequest(request, deps()));
