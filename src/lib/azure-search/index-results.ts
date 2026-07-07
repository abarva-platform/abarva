// Pure helpers for the Azure AI Search tenant-context backfill — extracted so
// they are unit-testable without the self-executing backfill script.

export type IndexResultEntry = {
  key?: string;
  status?: boolean;
  errorMessage?: string | null;
  statusCode?: number;
};

/**
 * Azure AI Search `/docs/index` returns HTTP 200 even when individual documents
 * are rejected — the per-document outcome is in `value[].status`. Collect the
 * rejected ones so a backfill fails loudly instead of silently indexing fewer
 * docs than the DB has (the "expected N, got N-k" search-verify gate failure).
 */
export function collectFailedIndexResults(
  body: unknown,
): Array<{ key: string; statusCode: number; errorMessage: string }> {
  const value = (body as { value?: IndexResultEntry[] } | null)?.value;
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && entry.status === false)
    .map((entry) => ({
      key: entry.key ?? "(unknown)",
      statusCode: entry.statusCode ?? 0,
      errorMessage: entry.errorMessage ?? "unknown",
    }));
}

/** Tenants whose observed Search doc count does not equal the expected DB count. */
export function countMismatches(
  expected: Record<string, number>,
  observed: Record<string, number>,
): string[] {
  return Object.entries(expected)
    .filter(([tenant, count]) => observed[tenant] !== count)
    .map(
      ([tenant, count]) =>
        `${tenant}: expected ${count}, got ${observed[tenant] ?? 0}`,
    );
}
