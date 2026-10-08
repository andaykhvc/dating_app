// Supabase Edge Function (Deno). Wires the real services into handler.ts.
// Secrets (set with `supabase secrets set`, never committed):
//   MODERATION_WEBHOOK_SECRET   shared secret the database trigger sends
//   MODERATION_MODE             off | shadow | enforce   (default off)
//   MODERATION_API_KEY          "<AWS access key id>:<AWS secret access key>"
//   MODERATION_REGION           AWS region, default eu-west-1 (Ireland)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleRequest, type Deps, type PhotoRow } from "./handler.ts";
import { RekognitionProvider } from "./providers/rekognition.ts";
import { parseMode } from "./types.ts";

const BUCKET = "profile-photos";
// Same convention as src/lib/photos.ts: the thumbnail sits next to the photo.
const thumbPath = (path: string) => path.replace(/(\.[a-z0-9]+)?$/i, ".thumb$1");

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function buildProvider() {
  const [accessKeyId, secretAccessKey] = (Deno.env.get("MODERATION_API_KEY") ?? "").split(":");
  if (!accessKeyId || !secretAccessKey) return null;
  return new RekognitionProvider({
    accessKeyId,
    secretAccessKey,
    region: Deno.env.get("MODERATION_REGION") ?? "eu-west-1",
  });
}

function deps(): Deps {
  return {
    mode: parseMode(Deno.env.get("MODERATION_MODE")),
    webhookSecret: Deno.env.get("MODERATION_WEBHOOK_SECRET"),
    provider: buildProvider(),

    async getPhoto(photoId) {
      const { data } = await admin
        .from("profile_photos")
        .select("id, user_id, storage_path, moderation_status")
        .eq("id", photoId)
        .maybeSingle();
      return (data as PhotoRow | null) ?? null;
    },

    async download(path) {
      const { data, error } = await admin.storage.from(BUCKET).download(path);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    },

    async countRecentCalls(userId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("photo_moderation_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("provider_called", true)
        .gte("created_at", since);
      return count ?? 0;
    },

    async approve(photoId) {
      const { error } = await admin.rpc("approve_photo", { p_photo_id: photoId, p_source: "auto" });
      return !error;
    },

    async reject(photoId, reason) {
      const { error } = await admin.rpc("reject_photo", {
        p_photo_id: photoId,
        p_reason: reason,
        p_source: "auto",
      });
      return !error;
    },

    async removeFiles(path) {
      await admin.storage.from(BUCKET).remove([path, thumbPath(path)]);
    },

    async log(event) {
      await admin.from("photo_moderation_events").insert({
        photo_id: event.photo_id,
        user_id: event.user_id,
        mode: event.mode,
        outcome: event.outcome,
        verdict: event.verdict ?? null,
        labels: event.labels ?? [],
        scores: event.scores ?? {},
        error: event.error ?? null,
        provider_called: event.verdict !== undefined,
      });
    },
  };
}

Deno.serve((request) => handleRequest(request, deps()));
