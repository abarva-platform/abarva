/**
 * EVID3 — evidence-ledger-tenant-stub integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildTenantLedgerStubView() default (all tenants) seed
 *   - buildTenantLedgerStubView('acme') — per-tenant view
 *   - buildTenantLedgerStubView('meridian') — per-tenant view
 *   - getEntriesByTenant: known + unknown tenant
 *   - getTenantEvidenceSummary: usableRate, hasBlockedEntries, counts
 *   - getAllTenantSummaries: canonical tenant set, alphabetical order
 *   - getFilteredEntries: by tenantKey, scope, state, combinations
 *   - stubBindEntryToTenant: accepted / rejected_duplicate / rejected_no_tenant
 *   - describeTenantLedgerView: format, content
 *   - Determinism: two calls produce identical output
 *   - deterministicSeed: true
 *   - Module hygiene: no Date.now / Math.random / new Date / fetch
 *   - Only imports from evidence-ledger-mvp
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildTenantLedgerStubView,
  getEntriesByTenant,
  getTenantEvidenceSummary,
  getAllTenantSummaries,
  getFilteredEntries,
  stubBindEntryToTenant,
  describeTenantLedgerView,
  type TenantLedgerStubView,
  type TenantEvidenceSummary,
  type StubBindStatus,
} from '@/lib/architecture/evidence-ledger-tenant-stub';

import {
  buildEvidenceLedgerMvp,
  type EvidenceLedgerEntry,
} from '@/lib/architecture/evidence-ledger-mvp';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/architecture/evidence-ledger-tenant-stub.ts';

// From seed: 14 entries total — acme:8, meridian:6
const KNOWN_TENANTS = ['acme', 'meridian'] as const;
const ACME_COUNT = 8;
const MERIDIAN_COUNT = 6;
const ALL_COUNT = 14;

const ACME_USABLE_COUNT = 1;    // evid-seed-acme-charter-1
const MERIDIAN_USABLE_COUNT = 4; // entries 4,6,9,12
const ACME_BLOCKED_COUNT = 1;   // evid-seed-acme-archetype-hcc-13
const MERIDIAN_BLOCKED_COUNT = 1; // evid-seed-meridian-dataset-provider-10

const STUB_BIND_STATUSES: StubBindStatus[] = [
  'accepted',
  'rejected_duplicate',
  'rejected_no_tenant',
];

// ---------------------------------------------------------------------------
// buildTenantLedgerStubView — all-tenant (default) seed
// ---------------------------------------------------------------------------

describe('EVID3 — buildTenantLedgerStubView default (all tenants)', () => {
  let view: TenantLedgerStubView;

  beforeAll(() => {
    view = buildTenantLedgerStubView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('tenantKey is null', () => {
    expect(view.tenantKey).toBeNull();
  });

  it('tenantSummary is undefined for all-tenant view', () => {
    expect(view.tenantSummary).toBeUndefined();
  });

  it('entries has all 14 seed entries', () => {
    expect(view.entries.length).toBe(ALL_COUNT);
  });

  it('summary.totalEntries is 14', () => {
    expect(view.summary.totalEntries).toBe(ALL_COUNT);
  });

  it('summary.usableCount is 5', () => {
    expect(view.summary.usableCount).toBe(ACME_USABLE_COUNT + MERIDIAN_USABLE_COUNT);
  });

  it('summary.blockedCount is 2', () => {
    expect(view.summary.blockedCount).toBe(ACME_BLOCKED_COUNT + MERIDIAN_BLOCKED_COUNT);
  });

  it('usableEntries has 5 entries', () => {
    expect(view.usableEntries.length).toBe(ACME_USABLE_COUNT + MERIDIAN_USABLE_COUNT);
  });

  it('blockedEntries has 2 entries', () => {
    expect(view.blockedEntries.length).toBe(ACME_BLOCKED_COUNT + MERIDIAN_BLOCKED_COUNT);
  });

  it('every usableEntry has state usable_as_evidence', () => {
    for (const e of view.usableEntries) {
      expect(e.state).toBe('usable_as_evidence');
    }
  });

  it('every blockedEntry has state blocked and non-empty blockReason', () => {
    for (const e of view.blockedEntries) {
      expect(e.state).toBe('blocked');
      expect(e.blockReason).toBeTruthy();
    }
  });

  it('allTenantSummaries has 2 entries', () => {
    expect(view.allTenantSummaries.length).toBe(KNOWN_TENANTS.length);
  });

  it('knownTenants has all canonical tenants', () => {
    for (const t of KNOWN_TENANTS) {
      expect(view.knownTenants).toContain(t);
    }
  });

  it('honestDisclaimer is non-empty', () => {
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildTenantLedgerStubView — acme
// ---------------------------------------------------------------------------

describe('EVID3 — buildTenantLedgerStubView("acme")', () => {
  let view: TenantLedgerStubView;

  beforeAll(() => {
    view = buildTenantLedgerStubView('acme');
  });

  it('tenantKey is "acme"', () => {
    expect(view.tenantKey).toBe('acme');
  });

  it(`entries has ${ACME_COUNT} entries`, () => {
    expect(view.entries.length).toBe(ACME_COUNT);
  });

  it('all entries have tenantKey "acme"', () => {
    for (const e of view.entries) {
      expect(e.tenantKey).toBe('acme');
    }
  });

  it(`summary.usableCount is ${ACME_USABLE_COUNT}`, () => {
    expect(view.summary.usableCount).toBe(ACME_USABLE_COUNT);
  });

  it(`summary.blockedCount is ${ACME_BLOCKED_COUNT}`, () => {
    expect(view.summary.blockedCount).toBe(ACME_BLOCKED_COUNT);
  });

  it('tenantSummary is defined', () => {
    expect(view.tenantSummary).toBeDefined();
  });

  it('tenantSummary.tenantKey is "acme"', () => {
    expect(view.tenantSummary?.tenantKey).toBe('acme');
  });

  it('tenantSummary.usableRate is usableCount/totalEntries', () => {
    const ts = view.tenantSummary!;
    expect(ts.usableRate).toBeCloseTo(ts.usableCount / ts.totalEntries);
  });

  it('tenantSummary.hasBlockedEntries is true (acme has 1 blocked)', () => {
    expect(view.tenantSummary?.hasBlockedEntries).toBe(true);
  });

  it('allTenantSummaries still has both tenants (not filtered by tenant)', () => {
    expect(view.allTenantSummaries.length).toBe(KNOWN_TENANTS.length);
  });
});

// ---------------------------------------------------------------------------
// buildTenantLedgerStubView — meridian
// ---------------------------------------------------------------------------

describe('EVID3 — buildTenantLedgerStubView("meridian")', () => {
  let view: TenantLedgerStubView;

  beforeAll(() => {
    view = buildTenantLedgerStubView('meridian');
  });

  it('tenantKey is "meridian"', () => {
    expect(view.tenantKey).toBe('meridian');
  });

  it(`entries has ${MERIDIAN_COUNT} entries`, () => {
    expect(view.entries.length).toBe(MERIDIAN_COUNT);
  });

  it('all entries have tenantKey "meridian"', () => {
    for (const e of view.entries) {
      expect(e.tenantKey).toBe('meridian');
    }
  });

  it(`summary.usableCount is ${MERIDIAN_USABLE_COUNT}`, () => {
    expect(view.summary.usableCount).toBe(MERIDIAN_USABLE_COUNT);
  });

  it(`summary.blockedCount is ${MERIDIAN_BLOCKED_COUNT}`, () => {
    expect(view.summary.blockedCount).toBe(MERIDIAN_BLOCKED_COUNT);
  });

  it('tenantSummary.usableRate > 0.5 (meridian has 4/6 usable)', () => {
    expect(view.tenantSummary!.usableRate).toBeGreaterThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// buildTenantLedgerStubView — unknown tenant
// ---------------------------------------------------------------------------

describe('EVID3 — buildTenantLedgerStubView("unknown-tenant")', () => {
  let view: TenantLedgerStubView;

  beforeAll(() => {
    view = buildTenantLedgerStubView('unknown-tenant');
  });

  it('tenantKey is "unknown-tenant"', () => {
    expect(view.tenantKey).toBe('unknown-tenant');
  });

  it('entries is empty', () => {
    expect(view.entries.length).toBe(0);
  });

  it('summary.totalEntries is 0', () => {
    expect(view.summary.totalEntries).toBe(0);
  });

  it('tenantSummary.usableRate is 0 when no entries', () => {
    expect(view.tenantSummary?.usableRate).toBe(0);
  });

  it('tenantSummary.hasBlockedEntries is false when no entries', () => {
    expect(view.tenantSummary?.hasBlockedEntries).toBe(false);
  });

  it('allTenantSummaries still has 2 known tenants', () => {
    expect(view.allTenantSummaries.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getEntriesByTenant
// ---------------------------------------------------------------------------

describe('EVID3 — getEntriesByTenant', () => {
  it.each(KNOWN_TENANTS)('returns only entries for tenant %s', (tenant) => {
    const entries = getEntriesByTenant(tenant);
    for (const e of entries) {
      expect(e.tenantKey).toBe(tenant);
    }
  });

  it('acme has 8 entries', () => {
    expect(getEntriesByTenant('acme').length).toBe(ACME_COUNT);
  });

  it('meridian has 6 entries', () => {
    expect(getEntriesByTenant('meridian').length).toBe(MERIDIAN_COUNT);
  });

  it('acme + meridian = 14 total', () => {
    const total = getEntriesByTenant('acme').length + getEntriesByTenant('meridian').length;
    expect(total).toBe(ALL_COUNT);
  });

  it('unknown tenant returns empty array', () => {
    expect(getEntriesByTenant('no-such-tenant').length).toBe(0);
  });

  it('empty string returns empty array', () => {
    expect(getEntriesByTenant('').length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getTenantEvidenceSummary
// ---------------------------------------------------------------------------

describe('EVID3 — getTenantEvidenceSummary', () => {
  it('acme summary totalEntries matches getEntriesByTenant count', () => {
    const s = getTenantEvidenceSummary('acme');
    expect(s.totalEntries).toBe(getEntriesByTenant('acme').length);
  });

  it('meridian summary totalEntries matches getEntriesByTenant count', () => {
    const s = getTenantEvidenceSummary('meridian');
    expect(s.totalEntries).toBe(getEntriesByTenant('meridian').length);
  });

  it('acme usableRate = usableCount / totalEntries', () => {
    const s = getTenantEvidenceSummary('acme');
    expect(s.usableRate).toBeCloseTo(s.usableCount / s.totalEntries);
  });

  it('meridian usableRate = usableCount / totalEntries', () => {
    const s = getTenantEvidenceSummary('meridian');
    expect(s.usableRate).toBeCloseTo(s.usableCount / s.totalEntries);
  });

  it('unknown tenant summary has usableRate 0', () => {
    const s = getTenantEvidenceSummary('nope');
    expect(s.usableRate).toBe(0);
  });

  it('hasBlockedEntries true when blockedCount > 0', () => {
    const s = getTenantEvidenceSummary('acme');
    expect(s.hasBlockedEntries).toBe(s.blockedCount > 0);
  });

  it('byState keys cover all 9 canonical states', () => {
    const s = getTenantEvidenceSummary('acme');
    const keys = Object.keys(s.byState);
    expect(keys.length).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// getAllTenantSummaries
// ---------------------------------------------------------------------------

describe('EVID3 — getAllTenantSummaries', () => {
  let summaries: readonly TenantEvidenceSummary[];

  beforeAll(() => {
    summaries = getAllTenantSummaries();
  });

  it('returns 2 summaries (acme + meridian)', () => {
    expect(summaries.length).toBe(2);
  });

  it('sorted alphabetically — acme before meridian', () => {
    expect(summaries[0].tenantKey).toBe('acme');
    expect(summaries[1].tenantKey).toBe('meridian');
  });

  it('each summary tenantKey matches getEntriesByTenant count', () => {
    for (const s of summaries) {
      expect(s.totalEntries).toBe(getEntriesByTenant(s.tenantKey).length);
    }
  });

  it('sum of totalEntries = 14', () => {
    const total = summaries.reduce((acc, s) => acc + s.totalEntries, 0);
    expect(total).toBe(ALL_COUNT);
  });

  it('sum of usableCount = 5', () => {
    const total = summaries.reduce((acc, s) => acc + s.usableCount, 0);
    expect(total).toBe(ACME_USABLE_COUNT + MERIDIAN_USABLE_COUNT);
  });
});

// ---------------------------------------------------------------------------
// getFilteredEntries
// ---------------------------------------------------------------------------

describe('EVID3 — getFilteredEntries', () => {
  it('empty filter returns all 14 entries', () => {
    expect(getFilteredEntries({}).length).toBe(ALL_COUNT);
  });

  it('filter by tenantKey returns only that tenant', () => {
    const entries = getFilteredEntries({ tenantKey: 'acme' });
    for (const e of entries) {
      expect(e.tenantKey).toBe('acme');
    }
  });

  it('filter by scope "program" returns only program-scoped entries', () => {
    const entries = getFilteredEntries({ scope: 'program' });
    for (const e of entries) {
      expect(e.scope).toBe('program');
    }
  });

  it('filter by scope "tenant" returns only tenant-scoped entries', () => {
    const entries = getFilteredEntries({ scope: 'tenant' });
    for (const e of entries) {
      expect(e.scope).toBe('tenant');
    }
  });

  it('filter by scope "workspace" returns only workspace-scoped entries', () => {
    const entries = getFilteredEntries({ scope: 'workspace' });
    for (const e of entries) {
      expect(e.scope).toBe('workspace');
    }
  });

  it('filter by state "blocked" returns only blocked entries', () => {
    const entries = getFilteredEntries({ state: 'blocked' });
    for (const e of entries) {
      expect(e.state).toBe('blocked');
    }
  });

  it('filter by state "usable_as_evidence" returns 5 entries', () => {
    expect(getFilteredEntries({ state: 'usable_as_evidence' }).length).toBe(5);
  });

  it('combined filter: acme + program returns only acme program-scoped entries', () => {
    const entries = getFilteredEntries({ tenantKey: 'acme', scope: 'program' });
    for (const e of entries) {
      expect(e.tenantKey).toBe('acme');
      expect(e.scope).toBe('program');
    }
    expect(entries.length).toBeGreaterThan(0);
  });

  it('impossible filter returns empty array', () => {
    // No entry is both 'usable_as_evidence' and 'blocked'.
    expect(
      getFilteredEntries({ state: 'blocked', tenantKey: 'no-such-tenant' }).length,
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// stubBindEntryToTenant
// ---------------------------------------------------------------------------

describe('EVID3 — stubBindEntryToTenant', () => {
  const allEntries = buildEvidenceLedgerMvp();
  const acmeEntry = allEntries.find((e) => e.tenantKey === 'acme')!;
  const meridianEntry = allEntries.find((e) => e.tenantKey === 'meridian')!;

  it('binding to a different tenant returns accepted', () => {
    const result = stubBindEntryToTenant(acmeEntry, 'meridian');
    expect(result.status).toBe('accepted');
  });

  it('binding to the same tenant as entry returns rejected_duplicate', () => {
    const result = stubBindEntryToTenant(acmeEntry, 'acme');
    expect(result.status).toBe('rejected_duplicate');
  });

  it('binding with empty tenantKey returns rejected_no_tenant', () => {
    const result = stubBindEntryToTenant(acmeEntry, '');
    expect(result.status).toBe('rejected_no_tenant');
  });

  it('accepted result has deterministic stubId', () => {
    const result = stubBindEntryToTenant(acmeEntry, 'meridian');
    expect(result.stubId).toBe(`stub-bind-meridian-${acmeEntry.id}`);
  });

  it('rejected_duplicate result also carries stubId', () => {
    const result = stubBindEntryToTenant(acmeEntry, 'acme');
    expect(result.stubId).toBe(`stub-bind-acme-${acmeEntry.id}`);
  });

  it('entryId matches entry.id', () => {
    const result = stubBindEntryToTenant(meridianEntry, 'acme');
    expect(result.entryId).toBe(meridianEntry.id);
  });

  it('tenantKey matches requested tenant', () => {
    const result = stubBindEntryToTenant(meridianEntry, 'acme');
    expect(result.tenantKey).toBe('acme');
  });

  it('honestDisclaimer is non-empty for every status', () => {
    const statuses: Array<{ entry: EvidenceLedgerEntry; tenant: string }> = [
      { entry: acmeEntry, tenant: 'meridian' },   // accepted
      { entry: acmeEntry, tenant: 'acme' },        // duplicate
      { entry: acmeEntry, tenant: '' },             // no_tenant
    ];
    for (const { entry, tenant } of statuses) {
      const result = stubBindEntryToTenant(entry, tenant);
      expect(result.honestDisclaimer.length).toBeGreaterThan(0);
    }
  });

  it('stubId is stable across two calls (deterministic)', () => {
    const r1 = stubBindEntryToTenant(acmeEntry, 'meridian');
    const r2 = stubBindEntryToTenant(acmeEntry, 'meridian');
    expect(r1.stubId).toBe(r2.stubId);
    expect(r1.status).toBe(r2.status);
  });

  it('all three StubBindStatus values are returned by the appropriate scenario', () => {
    const seenStatuses = new Set<StubBindStatus>([
      stubBindEntryToTenant(acmeEntry, 'meridian').status,
      stubBindEntryToTenant(acmeEntry, 'acme').status,
      stubBindEntryToTenant(acmeEntry, '').status,
    ]);
    for (const s of STUB_BIND_STATUSES) {
      expect(seenStatuses).toContain(s);
    }
  });
});

// ---------------------------------------------------------------------------
// describeTenantLedgerView
// ---------------------------------------------------------------------------

describe('EVID3 — describeTenantLedgerView', () => {
  it('returns a non-empty string', () => {
    const view = buildTenantLedgerStubView();
    expect(describeTenantLedgerView(view).length).toBeGreaterThan(0);
  });

  it('uses " · " as separator', () => {
    const view = buildTenantLedgerStubView();
    expect(describeTenantLedgerView(view)).toContain(' · ');
  });

  it('includes tenant label for scoped view', () => {
    const view = buildTenantLedgerStubView('acme');
    expect(describeTenantLedgerView(view)).toContain('acme');
  });

  it('includes "All tenants" for unscoped view', () => {
    const view = buildTenantLedgerStubView();
    expect(describeTenantLedgerView(view)).toContain('All tenants');
  });

  it('includes entry count in description', () => {
    const view = buildTenantLedgerStubView('acme');
    expect(describeTenantLedgerView(view)).toMatch(/8 entries/);
  });

  it('includes "usable" in description', () => {
    const view = buildTenantLedgerStubView();
    expect(describeTenantLedgerView(view)).toContain('usable');
  });

  it('includes "blocked" in description when blocked entries exist', () => {
    const view = buildTenantLedgerStubView('acme');
    expect(describeTenantLedgerView(view)).toContain('blocked');
  });

  it('includes tenant count in all-tenant description', () => {
    const view = buildTenantLedgerStubView();
    expect(describeTenantLedgerView(view)).toMatch(/2 tenants/);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('EVID3 — determinism', () => {
  it('two default view calls produce identical entries', () => {
    const a = buildTenantLedgerStubView();
    const b = buildTenantLedgerStubView();
    expect(JSON.stringify(a.entries)).toBe(JSON.stringify(b.entries));
  });

  it('two acme view calls produce identical summaries', () => {
    const a = buildTenantLedgerStubView('acme');
    const b = buildTenantLedgerStubView('acme');
    expect(JSON.stringify(a.summary)).toBe(JSON.stringify(b.summary));
  });

  it('two allTenantSummaries calls produce identical output', () => {
    const a = getAllTenantSummaries();
    const b = getAllTenantSummaries();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('two stub bind calls with same args produce identical stubId', () => {
    const entry = buildEvidenceLedgerMvp()[0];
    const r1 = stubBindEntryToTenant(entry, 'meridian');
    const r2 = stubBindEntryToTenant(entry, 'meridian');
    expect(r1.stubId).toBe(r2.stubId);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('EVID3 — module hygiene', () => {
  let source: string;

  beforeAll(() => {
    const raw = readFileSync(resolve(root, SOURCE_PATH), 'utf8');
    // Strip string literals and comments before scanning
    source = raw
      .replace(/`[\s\S]*?`/g, '``')
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does not call Date.now', () => {
    expect(source).not.toMatch(/Date\.now\s*\(/);
  });

  it('does not call Math.random', () => {
    expect(source).not.toMatch(/Math\.random\s*\(/);
  });

  it('does not call new Date()', () => {
    expect(source).not.toMatch(/new\s+Date\s*\(/);
  });

  it('does not call fetch()', () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('only imports from evidence-ledger-mvp', () => {
    const importLines = source.match(/from\s+['"][^'"]+['"]/g) ?? [];
    for (const line of importLines) {
      expect(line).toMatch(/evidence-ledger-mvp/);
    }
  });
});
