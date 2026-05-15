/**
 * Canonical tenant-key normalization.
 *
 * Three of our seeded tenants have historical aliases that still appear in
 * older substrate tables and a handful of hard-coded application paths.
 * Anywhere data flows from the app into a tenant-scoped retrieval surface
 * (Postgres, Azure AI Search, the broker), tenant keys MUST be canonicalized
 * first — otherwise queries split between the alias and the canonical key
 * and return empty bundles.
 *
 * | Canonical         | Historical aliases     |
 * | ----------------- | ---------------------- |
 * | apex-retail       | apexretail             |
 * | meridian-health   | meridian               |
 * | first-capital     | arcturus               |
 *
 * This module is the single source of truth for that map. The Azure AI
 * Search adapter, the verification script, and any future writers should
 * import from here.
 */

export const TENANT_KEY_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  apexretail: 'apex-retail',
  meridian: 'meridian-health',
  arcturus: 'first-capital',
});

/**
 * Return the canonical tenant key for a value that may be an alias.
 *
 * - Unknown strings pass through unchanged (forward-compatible).
 * - Null/undefined pass through unchanged.
 * - Empty strings pass through unchanged.
 *
 * The pass-through behavior is deliberate: callers that need strict
 * validation should layer their own assertion on top — this helper is for
 * normalization, not validation.
 */
export function canonicalTenantKey<T extends string | null | undefined>(
  tenantKey: T,
): T extends string ? string : T {
  if (tenantKey == null) return tenantKey as never;
  // We only rewrite known aliases; everything else (including the empty
  // string and unknown tenants) is returned as-is.
  const mapped = TENANT_KEY_ALIASES[tenantKey as string];
  return (mapped ?? tenantKey) as never;
}

/**
 * Return true if the value is a known historical alias (not yet canonical).
 *
 * Used by the verification script and any guard rails that want to flag
 * non-canonical writes before they hit the database.
 */
export function isLegacyTenantAlias(value: unknown): value is keyof typeof TENANT_KEY_ALIASES {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TENANT_KEY_ALIASES, value);
}

/**
 * List of legacy alias strings. Useful for SQL `WHERE col IN (...)` clauses
 * generated from TypeScript.
 */
export const LEGACY_TENANT_ALIASES: readonly string[] = Object.freeze(Object.keys(TENANT_KEY_ALIASES));

/**
 * List of canonical tenant keys (deduplicated targets of the alias map).
 */
export const CANONICAL_TENANT_KEYS: readonly string[] = Object.freeze(
  Array.from(new Set(Object.values(TENANT_KEY_ALIASES))),
);
