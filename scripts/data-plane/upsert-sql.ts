// Pure SQL-builder helpers for the Supabase -> Azure drain — extracted so they
// are unit-testable without the self-executing drain script.

/**
 * Build the `on conflict (...) do update set ...` assignment clause.
 *
 * Columns that are part of the conflict target OR are protected (e.g. the
 * primary key, when the conflict target is a different natural key) are NEVER
 * rewritten — rewriting a PK on conflict would break referential integrity and
 * can itself violate the PK unique constraint.
 */
export function buildUpdateAssignments(
  columns: string[],
  conflictColumns: string[],
  protectedColumns: string[] = [],
): string {
  const noUpdate = new Set([...conflictColumns, ...protectedColumns]);
  const updateColumns = columns.filter((column) => !noUpdate.has(column));
  return updateColumns.length
    ? `do update set ${updateColumns
        .map((column) => `"${column}" = excluded."${column}"`)
        .join(", ")}`
    : "do nothing";
}
