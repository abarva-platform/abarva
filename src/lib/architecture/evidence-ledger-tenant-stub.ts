// EVID3 — Evidence Ledger Tenant-Bound Persistence Stub
//
// Deterministic, file-pure read model that simulates tenant-bound evidence
// ledger persistence by slicing the EVID2 seed set by `tenantKey`. Provides
// per-tenant summaries, a scoped view model, and stub bind/write operations
// that return deterministic results without touching a database or making any
// network calls.
//
// No Date.now, Math.random, new Date(), or fetch(). Every output is a pure
// function of its input and the EVID2 seed set.

import {
  buildEvidenceLedgerMvp,
  summarizeEvidenceLedger,
  getUsableEvidence,
  getBlockedEvidence,
  type EvidenceLedgerEntry,
  type EvidenceLedgerSummary,
  type EvidenceLedgerScope,
  type EvidenceLedgerUsabilityState,
} from './evidence-ledger-mvp';

// ---------------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------------

/** Per-tenant extension of EvidenceLedgerSummary. */
export interface TenantEvidenceSummary extends EvidenceLedgerSummary {
  tenantKey: string;
  /** usableCount / totalEntries — 0 when totalEntries === 0. */
  usableRate: number;
  hasBlockedEntries: boolean;
}

/** Status returned by a stub bind operation. */
export type StubBindStatus =
  | 'accepted'
  | 'rejected_duplicate'
  | 'rejected_no_tenant';

/** Deterministic result of a tenant-bound stub write / bind call. */
export interface TenantLedgerStubBindResult {
  /** Deterministic: `stub-bind-{tenantKey}-{entryId}` */
  stubId: string;
  tenantKey: string;
  entryId: string;
  status: StubBindStatus;
  honestDisclaimer: string;
}

/** Filter used to scope a TenantLedgerStubView query. */
export interface TenantLedgerFilter {
  tenantKey?: string;
  scope?: EvidenceLedgerScope;
  state?: EvidenceLedgerUsabilityState;
}

/** Top-level view model for the tenant-bound ledger stub. */
export interface TenantLedgerStubView {
  /** The bound tenant, or null when viewing all tenants. */
  tenantKey: string | null;
  /** All entries matching the active filter. */
  entries: readonly EvidenceLedgerEntry[];
  /** Ledger summary for the filtered entry set. */
  summary: EvidenceLedgerSummary;
  /** Per-tenant summary when tenantKey is bound; undefined otherwise. */
  tenantSummary: TenantEvidenceSummary | undefined;
  /** Entries in `usable_as_evidence` state (validated). */
  usableEntries: readonly EvidenceLedgerEntry[];
  /** Entries in `blocked` state (with non-empty blockReason). */
  blockedEntries: readonly EvidenceLedgerEntry[];
  /** One summary row per unique tenant in the full seed set. */
  allTenantSummaries: readonly TenantEvidenceSummary[];
  /** Canonical tenants represented in the full seed set. */
  knownTenants: readonly string[];
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------------

function computeUsableRate(usableCount: number, totalEntries: number): number {
  if (totalEntries === 0) return 0;
  return usableCount / totalEntries;
}

function buildTenantEvidenceSummary(
  tenantKey: string,
  entries: readonly EvidenceLedgerEntry[],
): TenantEvidenceSummary {
  const base = summarizeEvidenceLedger(entries);
  return {
    ...base,
    tenantKey,
    usableRate: computeUsableRate(base.usableCount, base.totalEntries),
    hasBlockedEntries: base.blockedCount > 0,
  };
}

// ---------------------------------------------------------------------------
// Public API — read helpers.
// ---------------------------------------------------------------------------

/**
 * Returns all ledger entries bound to the given tenantKey.
 * Returns an empty array if no entries match.
 */
export function getEntriesByTenant(tenantKey: string): readonly EvidenceLedgerEntry[] {
  return buildEvidenceLedgerMvp().filter((e) => e.tenantKey === tenantKey);
}

/**
 * Returns a per-tenant evidence summary for the given tenantKey.
 * If the tenant has no entries, all counts are 0.
 */
export function getTenantEvidenceSummary(tenantKey: string): TenantEvidenceSummary {
  const entries = getEntriesByTenant(tenantKey);
  return buildTenantEvidenceSummary(tenantKey, entries);
}

/**
 * Returns one TenantEvidenceSummary per unique tenant in the seed set,
 * sorted alphabetically by tenantKey.
 */
export function getAllTenantSummaries(): readonly TenantEvidenceSummary[] {
  const all = buildEvidenceLedgerMvp();
  const tenants = Array.from(new Set(all.map((e) => e.tenantKey))).sort();
  return tenants.map((key) =>
    buildTenantEvidenceSummary(
      key,
      all.filter((e) => e.tenantKey === key),
    ),
  );
}

/**
 * Returns all entries that match the given filter.
 * All filter fields are optional — omit to get the full set.
 */
export function getFilteredEntries(
  filter: TenantLedgerFilter,
): readonly EvidenceLedgerEntry[] {
  let entries = buildEvidenceLedgerMvp();
  if (filter.tenantKey !== undefined) {
    entries = entries.filter((e) => e.tenantKey === filter.tenantKey);
  }
  if (filter.scope !== undefined) {
    entries = entries.filter((e) => e.scope === filter.scope);
  }
  if (filter.state !== undefined) {
    entries = entries.filter((e) => e.state === filter.state);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Public API — stub write / bind.
// ---------------------------------------------------------------------------

/**
 * Simulates binding an entry to a tenant store. No database writes occur.
 * Returns a deterministic result whose `stubId` is stable across calls.
 *
 * - `accepted`:            entry.tenantKey matches the requested tenantKey
 * - `rejected_duplicate`:  entry already carries this tenantKey (same result)
 * - `rejected_no_tenant`:  tenantKey argument is empty
 */
export function stubBindEntryToTenant(
  entry: EvidenceLedgerEntry,
  tenantKey: string,
): TenantLedgerStubBindResult {
  const disclaimer =
    'Stub result only — no database write was performed. ' +
    'This operation is deterministic and safe for testing and canvas rendering.';

  if (!tenantKey || tenantKey.trim().length === 0) {
    return {
      stubId: `stub-bind-unknown-${entry.id}`,
      tenantKey: '',
      entryId: entry.id,
      status: 'rejected_no_tenant',
      honestDisclaimer: disclaimer,
    };
  }

  const stubId = `stub-bind-${tenantKey}-${entry.id}`;

  // Treat it as a duplicate if the entry already belongs to this tenant.
  if (entry.tenantKey === tenantKey) {
    return {
      stubId,
      tenantKey,
      entryId: entry.id,
      status: 'rejected_duplicate',
      honestDisclaimer: disclaimer,
    };
  }

  return {
    stubId,
    tenantKey,
    entryId: entry.id,
    status: 'accepted',
    honestDisclaimer: disclaimer,
  };
}

// ---------------------------------------------------------------------------
// Public API — view model builder.
// ---------------------------------------------------------------------------

/**
 * Builds a TenantLedgerStubView for the given tenantKey (or for all tenants
 * when tenantKey is omitted / undefined).
 */
export function buildTenantLedgerStubView(tenantKey?: string): TenantLedgerStubView {
  const filter: TenantLedgerFilter = tenantKey ? { tenantKey } : {};
  const entries = getFilteredEntries(filter);
  const summary = summarizeEvidenceLedger(entries);
  const usableEntries = getUsableEvidence(entries);
  const blockedEntries = getBlockedEvidence(entries);
  const allTenantSummaries = getAllTenantSummaries();
  const knownTenants = allTenantSummaries.map((s) => s.tenantKey);

  const tenantSummary = tenantKey
    ? buildTenantEvidenceSummary(tenantKey, entries)
    : undefined;

  return {
    tenantKey: tenantKey ?? null,
    entries,
    summary,
    tenantSummary,
    usableEntries,
    blockedEntries,
    allTenantSummaries,
    knownTenants,
    honestDisclaimer:
      'This ledger view is seeded from deterministic test fixtures. ' +
      'No live tenant data, retrieval, or persistence is in use.',
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Public API — describe helper.
// ---------------------------------------------------------------------------

/**
 * Returns a concise human-readable description of the view.
 * Uses " · " as a separator (canonical pattern).
 */
export function describeTenantLedgerView(view: TenantLedgerStubView): string {
  const scope = view.tenantKey ? `Tenant: ${view.tenantKey}` : 'All tenants';
  const total = `${view.summary.totalEntries} entries`;
  const usable = `${view.summary.usableCount} usable`;
  const blocked = view.summary.blockedCount > 0
    ? `${view.summary.blockedCount} blocked`
    : 'none blocked';
  const tenantCount = view.allTenantSummaries.length;
  const tenantNote = view.tenantKey
    ? ''
    : ` · ${tenantCount} tenant${tenantCount !== 1 ? 's' : ''}`;
  return `${scope} · ${total} · ${usable} · ${blocked}${tenantNote}`;
}
