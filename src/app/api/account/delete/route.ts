import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeleteConfirmed, isSameOrigin } from "@/lib/account-delete";
import { PHOTO_BUCKET } from "@/lib/photos";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Removes every file under the user's folder in the photo bucket (full photos
 * and their thumbnails). Done through the Storage API: deleting rows from
 * storage.objects with SQL does not remove the files themselves.
 */
async function removeUserPhotos(admin: Admin, userId: string) {
  const bucket = admin.storage.from(PHOTO_BUCKET);
  const paths: string[] = [];
  const pageSize = 100;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await bucket.list(userId, { limit: pageSize, offset });
    if (error) throw new Error(`list photos: ${error.message}`);
    paths.push(...(data ?? []).map((file) => `${userId}/${file.name}`));
    if (!data || data.length < pageSize) break;
  }

  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await bucket.remove(paths.slice(i, i + 100));
    if (error) throw new Error(`remove photos: ${error.message}`);
  }
}

/**
 * Permanently deletes the signed-in user's account. The user id always comes
 * from the verified session, never from the request, so nobody can delete
 * someone else's account.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: NO_STORE });
  }

  const body = await request.json().catch(() => null);
  if (!isDeleteConfirmed(body)) {
    return NextResponse.json(
      { error: "Type DELETE to confirm." },
      { status: 400, headers: NO_STORE },
    );
  }

  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    console.error("Account deletion is not configured: SUPABASE_SERVICE_ROLE_KEY is missing.");
    return NextResponse.json(
      { error: "Account deletion is not available right now. Please contact support." },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    // Files first: if this fails nothing is lost and the user can retry. Once
    // the auth row is gone there would be no owner left to clean up for.
    await removeUserPhotos(admin, user.id);

    // Cascades to the profile and everything that references it (see
    // supabase/migrations/999992_account_deletion.sql for the audit).
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`delete user: ${error.message}`);
  } catch (e) {
    console.error("Account deletion failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "We could not delete your account. Nothing else was changed — please try again." },
      { status: 500, headers: NO_STORE },
    );
  }

  // Clears the session cookies. The server-side revoke fails now that the user
  // no longer exists; the cookies are cleared regardless.
  await supabase.auth.signOut().catch(() => undefined);

  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
