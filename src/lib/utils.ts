export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Flattens a PostgREST embedded relation.
 *
 * Until `supabase gen types typescript` has been run against a real project the
 * query builder cannot tell a to-one embed from a to-many one and types both as
 * arrays, so every embedded row goes through here.
 */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
