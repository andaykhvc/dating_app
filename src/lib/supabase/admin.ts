import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses row-level security. Server-only (the import
 * above makes a client bundle fail to build) and read from a variable that must
 * never start with NEXT_PUBLIC_. Use it only after the caller's own session has
 * been verified, and only for what a user cannot do themselves (removing their
 * auth.users row).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
