import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photos";
import {
  EXPORT_FUNCTION_SECTIONS,
  EXPORT_MAX_ROWS_PER_TABLE,
  EXPORT_PAGE_SIZE,
  EXPORT_TABLES,
  buildExportDocument,
  type ExportTable,
} from "@/lib/account-export";

// Always per-user and always fresh.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Reads one table in pages with the caller's own session, so RLS applies. The
 * API returns at most 1000 rows per request; EXPORT_MAX_ROWS_PER_TABLE bounds
 * the total so a very large chat history cannot exhaust the function.
 */
async function readTable(supabase: Client, spec: ExportTable, userId: string) {
  const rows: Record<string, unknown>[] = [];
  let truncated = false;

  for (let from = 0; ; from += EXPORT_PAGE_SIZE) {
    let query = supabase.from(spec.table).select("*");
    if (spec.filter) query = query.eq(spec.filter[0], userId);
    const { data, error } = await query
      .order(spec.order, { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1);
    if (error) throw new Error(`${spec.table}: ${error.message}`);

    rows.push(...(data ?? []));
    if (!data || data.length < EXPORT_PAGE_SIZE) break;
    if (rows.length >= EXPORT_MAX_ROWS_PER_TABLE) {
      truncated = true;
      break;
    }
  }

  return { rows, truncated };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  // One export a minute per person, counted in the database so it holds across
  // serverless instances (an in-memory counter would reset per instance).
  const { data: waitSeconds, error: claimError } = await supabase.rpc("claim_data_export");
  if (claimError) {
    return NextResponse.json({ error: "Could not start the export." }, { status: 500, headers: NO_STORE });
  }
  if (typeof waitSeconds === "number" && waitSeconds > 0) {
    return NextResponse.json(
      { error: `Please wait ${waitSeconds} seconds before downloading your data again.` },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(waitSeconds) } },
    );
  }

  try {
    const [results, extras] = await Promise.all([
      Promise.all(EXPORT_TABLES.map((spec) => readTable(supabase, spec, user.id))),
      supabase.rpc("get_my_export_extras"),
    ]);
    if (extras.error) throw new Error(`extras: ${extras.error.message}`);

    const tables: Record<string, unknown> = {};
    const truncatedTables: string[] = [];
    EXPORT_TABLES.forEach((spec, i) => {
      const { rows, truncated } = results[i];
      tables[spec.key] = spec.single ? (rows[0] ?? null) : rows;
      if (truncated) truncatedTables.push(spec.key);
    });

    // The bucket is public, so a photo's URL is just its path; include it so the
    // file can be downloaded alongside this JSON.
    tables.photos = (tables.photos as { storage_path: string }[]).map((p) => ({
      ...p,
      url: photoUrl(p.storage_path),
    }));

    const extraData = (extras.data ?? {}) as Record<string, unknown>;
    const functions = Object.fromEntries(
      EXPORT_FUNCTION_SECTIONS.map((key) => [key, extraData[key] ?? []]),
    );

    const document = buildExportDocument({
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      },
      tables,
      functions,
      truncatedTables,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(document, null, 2), {
      status: 200,
      headers: {
        ...NO_STORE,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lingua-match-my-data-${stamp}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while collecting your data. Please try again." },
      { status: 500, headers: NO_STORE },
    );
  }
}
