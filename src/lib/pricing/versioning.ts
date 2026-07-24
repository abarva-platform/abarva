/**
 * Nexus Pricing Engine — PR2 versioning/idempotency service.
 *
 * A single, reusable implementation of the idempotency contract described in
 * the PR2 brief §6.4, used by every versioned/mutable-by-import table
 * (`pricing_taxonomy_versions`, `pricing_rate_cards`, `pricing_client_profiles`,
 * and friends) instead of duplicating the same hash/compare/bump logic per
 * table.
 *
 * The contract:
 *   - Same content hash as the current row -> no-op (do not write anything,
 *     do not bump the version).
 *   - Different content hash -> insert a new row at `currentVersion + 1`
 *     (or `1` if there is no current row yet); the previous current row's
 *     `is_current` flips to `false` — its own row is NEVER updated/deleted,
 *     only superseded by a newer one.
 *
 * Everything here is pure (no I/O) so it is fully unit-testable without a
 * database — the DB-touching callers (reference-pack-loader.ts,
 * rate-card-repository.ts, etc.) call these functions to DECIDE what to do,
 * then perform the actual read/write themselves.
 */
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Deterministic content hashing
// ---------------------------------------------------------------------------

/**
 * Recursively sorts object keys so two payloads with the same data but
 * different key insertion order hash identically. Arrays are left in the
 * caller's order — callers that need row-set-level determinism (e.g. the
 * reference-pack loader) are responsible for sorting arrays by a stable key
 * (row code) before calling this, exactly like
 * `scripts/pricing/csv-utils.ts`'s `toCsv()` already requires for the CSV
 * write path.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = canonicalize(v);
    return out;
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}

/** sha256 hex digest of the canonical (sorted-key) JSON form of `payload`. */
export function computeContentHash(payload: unknown): string {
  const canonical = JSON.stringify(canonicalize(payload));
  return createHash("sha256").update(canonical).digest("hex");
}

// ---------------------------------------------------------------------------
// Version decision
// ---------------------------------------------------------------------------

export interface CurrentVersionedRow {
  readonly version: number;
  readonly contentHash: string;
}

export type VersionDecision =
  | { readonly action: "noop"; readonly version: number }
  | {
      readonly action: "new_version";
      readonly version: number;
      readonly previousVersion: number | null;
    };

/**
 * Decide whether a newly-computed content hash requires a new version row,
 * or is an idempotent no-op against the current row.
 */
export function decideVersionAction(
  newContentHash: string,
  currentRow: CurrentVersionedRow | null,
): VersionDecision {
  if (!currentRow) {
    return { action: "new_version", version: 1, previousVersion: null };
  }
  if (currentRow.contentHash === newContentHash) {
    return { action: "noop", version: currentRow.version };
  }
  return {
    action: "new_version",
    version: currentRow.version + 1,
    previousVersion: currentRow.version,
  };
}

// ---------------------------------------------------------------------------
// Idempotency-key duplicate detection
// ---------------------------------------------------------------------------

/**
 * Given a row set and a key-extraction function, returns the list of
 * duplicate keys (a key appearing on more than one row). Used to prove, at
 * the application layer and in tests, that the same shape of collision a
 * database UNIQUE constraint rejects is also detectable before the write is
 * even attempted — see `src/lib/pricing/__tests__/versioning.test.ts` for one
 * test per brief §6.4 idempotency key (role, role alias, rate card, rate
 * line, client profile assumption).
 */
export function findDuplicateKeys<T>(
  rows: readonly T[],
  keyFn: (row: T) => string,
): string[] {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

/**
 * The COALESCE-to-sentinel pattern used by every nullable-dimension unique
 * index in the PR2 migrations (pricing_role_aliases, pricing_rate_cards,
 * pricing_rate_card_lines, pricing_technology_cost_defaults) — a stand-in
 * for SQL's `COALESCE(column, '<sentinel>')` so application-layer duplicate
 * detection matches the database index's actual comparison semantics
 * exactly (two NULLs must compare equal to each other, never to a real
 * value that happens to equal the sentinel string).
 */
export function coalesceKeyPart(
  value: string | null | undefined,
  sentinel: string,
): string {
  return value === null || value === undefined ? sentinel : value;
}
