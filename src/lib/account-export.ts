/**
 * What "Download my data" contains. Every table that holds personal data about
 * a user is listed here (or in EXCLUDED_TABLES with the reason), and
 * scripts/account-export.test.ts fails when a new table in supabase/migrations
 * is in neither list, so a new feature has to decide whether its data is
 * exportable.
 *
 * The export runs with the user's own session: row-level security decides what
 * comes back, and `filter` narrows tables whose policy also lets a match
 * partner read rows.
 */
export const EXPORT_SCHEMA_VERSION = 1;

/** Rows per page; Supabase's API returns at most 1000 per request. */
export const EXPORT_PAGE_SIZE = 1000;
/** Per-table cap, so one export stays within serverless time and size limits. */
export const EXPORT_MAX_ROWS_PER_TABLE = 50_000;

export type ExportTable = {
  /** Key in the exported JSON. */
  key: string;
  table: string;
  /** Stable pagination order. */
  order: string;
  /** Extra equality filter, as [column, "uid"]; "uid" is the user's id. */
  filter?: [column: string, value: "uid"];
  /** True when the table holds one row for the user rather than many. */
  single?: boolean;
};

export const EXPORT_TABLES: ExportTable[] = [
  { key: "profile", table: "profiles", order: "id", single: true },
  { key: "languages", table: "user_languages", order: "id" },
  { key: "interests", table: "user_interests", order: "interest_id" },
  { key: "photos", table: "profile_photos", order: "position" },
  { key: "swipes_made", table: "swipes", order: "id" },
  { key: "matches", table: "matches", order: "id" },
  { key: "messages", table: "messages", order: "id" },
  { key: "message_corrections", table: "message_corrections", order: "created_at" },
  { key: "match_missions", table: "match_missions", order: "id" },
  { key: "blocks", table: "blocks", order: "id" },
  { key: "reports_filed", table: "reports", order: "id" },
  { key: "content_flags_filed", table: "content_flags", order: "id" },
  { key: "xp_events", table: "xp_events", order: "id" },
  { key: "progress", table: "user_progress", order: "user_id", single: true },
  { key: "game_sessions", table: "game_sessions", order: "id", filter: ["initiator_id", "uid"] },
  { key: "concept_progress", table: "user_concept_progress", order: "concept_id" },
  { key: "lesson_progress", table: "user_lesson_progress", order: "lesson_id" },
  { key: "phrase_shares", table: "phrase_shares", order: "id" },
  { key: "push_tokens", table: "push_tokens", order: "id" },
];

/** Provided by SQL functions rather than a plain table read (see 99998). */
export const EXPORT_FUNCTION_SECTIONS = ["match_partners", "lesson_sessions"] as const;

/** Tables that exist but are intentionally not in the export, and why. */
export const EXCLUDED_TABLES: Record<string, string> = {
  languages: "Reference data, not personal data.",
  interests: "Reference data, not personal data.",
  example_sentences: "Content, not personal data.",
  vocabulary_words: "Content, not personal data.",
  conversation_prompts: "Content, not personal data.",
  game_templates: "Content, not personal data.",
  game_content: "Content, not personal data.",
  missions: "Content, not personal data.",
  content_sources: "Content licensing records, not personal data.",
  content_import_batches: "Content import logs, not personal data.",
  courses: "Course content, not personal data.",
  blocked_terms: "Moderation word list written by us, not personal data (and kept private on purpose).",
  name_allowlist: "Moderation allow-list written by us, not personal data.",
  units: "Course content, not personal data.",
  skills: "Course content, not personal data.",
  lessons: "Course content, not personal data.",
  concepts: "Course content, not personal data.",
  concept_translations: "Course content, not personal data.",
  lesson_concepts: "Course content, not personal data.",
  exercise_templates: "Course content, not personal data.",
  lesson_sessions: "Exported via a function that leaves out the answer-key column.",
  practice_runs: "Holds the generated cards with their answer keys and is closed to the browser. What it earned is in xp_events and what was learned in concept_progress; a key-free summary can be added later.",
  data_export_requests: "Rate-limit bookkeeping for this export.",
};

export type ExportDocument = {
  _about: {
    title: string;
    exported_at: string;
    schema_version: number;
    format: string;
    included: string[];
    excluded: string[];
    truncated_tables: string[];
    notes: string[];
  };
  account: { id: string; email: string | null; created_at?: string; last_sign_in_at?: string | null };
  [section: string]: unknown;
};

export type ExportSections = {
  account: ExportDocument["account"];
  tables: Record<string, unknown>;
  functions: Record<string, unknown>;
  truncatedTables: string[];
};

/** Pure assembly of the downloadable document, so it can be tested. */
export function buildExportDocument(sections: ExportSections, now: Date = new Date()): ExportDocument {
  const doc: ExportDocument = {
    _about: {
      title: "Your Lingua Match data",
      exported_at: now.toISOString(),
      schema_version: EXPORT_SCHEMA_VERSION,
      format: "JSON. Each top-level key is one kind of data we hold about you; dates are ISO 8601 (UTC).",
      included: [
        "account",
        ...EXPORT_TABLES.map((t) => t.key),
        ...EXPORT_FUNCTION_SECTIONS,
      ],
      excluded: [
        "Other people's personal data: for each match only the partner's first name is included (match_partners), not their profile, photos or other details.",
        "Reports about you filed by other people, and moderation or security logs: these protect other users and the service.",
        "Photo files themselves: the photos section lists each file with its URL; download them from those links.",
        "Course content and reference data, which is not personal data.",
        "Anything that is only held by sign-in providers (Google, Apple) or by your email provider.",
      ],
      truncated_tables: sections.truncatedTables,
      notes: [
        `Each table is capped at ${EXPORT_MAX_ROWS_PER_TABLE} rows; tables that hit the cap are listed in truncated_tables.`,
        "Messages include both the ones you sent and the ones you received in your matches.",
      ],
    },
    account: sections.account,
  };
  for (const t of EXPORT_TABLES) doc[t.key] = sections.tables[t.key] ?? (t.single ? null : []);
  for (const key of EXPORT_FUNCTION_SECTIONS) doc[key] = sections.functions[key] ?? [];
  return doc;
}
