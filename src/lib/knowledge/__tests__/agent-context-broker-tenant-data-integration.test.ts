/**
 * TD-5 — broker as a two-source consumer.
 *
 * Verifies that {@link buildEnterpriseAgentContextBundleAsync} prefers
 * persisted tenant data when the adapter reports `hasPersistedData ===
 * true`, and otherwise falls back to the synchronous code-fixture path.
 * The bundle's `warnings` array tags the source basis so callers can
 * surface freshness in the UI without inspecting every item, and the
 * persisted path never mixes in fixture rows.
 */

jest.mock('server-only', () => ({}));

import {
  TENANT_DATA_FIXTURE_WARNING,
  TENANT_DATA_PERSISTED_WARNING,
  buildEnterpriseAgentContextBundleAsync,
} from '@/lib/knowledge/agent-context-broker';
import type { TenantDataAdapter } from '@/lib/knowledge/tenant-data';
import type {
  GraphNeighborhood,
  SegmentId,
  TenantRecord,
} from '@/lib/knowledge/tenant-data';

// ---------------------------------------------------------------------------
// Adapter mocking — `getTenantDataAdapter()` is the only seam between the
// broker and the persisted layer. We replace it with a fake adapter whose
// per-segment record sets are scoped to one tenant at a time so the tests
// can also assert tenant isolation.
// ---------------------------------------------------------------------------

let fakeAdapter: TenantDataAdapter = makeEmptyAdapter();

jest.mock('@/lib/knowledge/tenant-data', () => {
  const actual = jest.requireActual('@/lib/knowledge/tenant-data');
  return {
    ...actual,
    getTenantDataAdapter: (): TenantDataAdapter => fakeAdapter,
  };
});

function makeEmptyAdapter(): TenantDataAdapter {
  return {
    listSegments: () => Promise.resolve([]),
    listRecords: () => Promise.resolve([]),
    getRecord: () => Promise.resolve(null),
    listGraphNodes: () => Promise.resolve([]),
    listGraphEdgesForNode: () => Promise.resolve([]),
    getGraphNeighborhood: (_t, rootId) => {
      const neighborhood: GraphNeighborhood = {
        rootId,
        nodes: [],
        edges: [],
        depth: 0,
      };
      return Promise.resolve(neighborhood);
    },
    pathBetween: () => Promise.resolve(null),
    listContextChunks: () => Promise.resolve([]),
    chunksByRecord: () => Promise.resolve([]),
    chunksByKeyword: () => Promise.resolve([]),
    chunksByVector: () =>
      Promise.reject(new Error('Vector retrieval not yet enabled.')),
    getEvidence: () => Promise.resolve(null),
    hasPersistedData: () => Promise.resolve(false),
  };
}

interface PersistedTenantSpec {
  tenantKey: string;
  segments: Partial<Record<SegmentId, TenantRecord[]>>;
}

/**
 * Build an adapter that reports `hasPersistedData === true` for the
 * tenants in `tenants` and serves their per-segment records. Other
 * tenants get the empty default — they fall through to the fixture
 * path. This is the central seam that the tenant-isolation assertion
 * relies on.
 */
function makePersistedAdapter(
  tenants: PersistedTenantSpec[],
): TenantDataAdapter {
  const byTenant = new Map<string, PersistedTenantSpec>();
  for (const spec of tenants) {
    byTenant.set(spec.tenantKey, spec);
  }
  return {
    ...makeEmptyAdapter(),
    hasPersistedData: (tenantKey: string) =>
      Promise.resolve(byTenant.has(tenantKey)),
    listRecords: (tenantKey: string, segmentId: SegmentId) => {
      const spec = byTenant.get(tenantKey);
      if (!spec) return Promise.resolve([]);
      return Promise.resolve(spec.segments[segmentId] ?? []);
    },
  };
}

// ---------------------------------------------------------------------------
// Fixture record builders — minimal-but-realistic payloads that the TD-4
// mapper accepts. Keeping payloads small isolates the broker assertions.
// ---------------------------------------------------------------------------

function personRecord(
  tenantKey: string,
  slug: string,
  role: string,
): TenantRecord {
  return {
    tenantKey,
    segmentId: 'org_structure',
    recordKind: 'org_role',
    recordId: `org_structure:role:${tenantKey}:${slug}`,
    title: `${slug} — ${role}`,
    sourceBasis: 'tenant_admin_upload',
    classification: 'internal',
    payload: {
      role,
      org_unit: 'IT Leadership',
      reports_to_role: 'CEO',
      priorities: ['Modernize merchandising stack'],
    },
  };
}

function programRecord(
  tenantKey: string,
  slug: string,
  phase: string,
): TenantRecord {
  return {
    tenantKey,
    segmentId: 'program_inventory',
    recordKind: 'program_record',
    recordId: `program_inventory:program:${tenantKey}:${slug}`,
    title: slug,
    sourceBasis: 'tenant_admin_upload',
    classification: 'confidential',
    payload: {
      current_phase_name: phase,
      sponsor: 'CIO',
      program_lead: 'VP Apps',
      budget_approved_usd: 4_500_000,
      budget_consumed_usd: 1_200_000,
    },
  };
}

function crossProgramSignalRecord(
  tenantKey: string,
  slug: string,
): TenantRecord {
  return {
    tenantKey,
    segmentId: 'cross_program_signals',
    recordKind: 'cross_program_signal',
    recordId: `cross_program_signals:xprog:${tenantKey}:${slug}`,
    title: `Shared lead — ${slug}`,
    sourceBasis: 'tenant_admin_upload',
    classification: 'internal',
    payload: {
      programs: ['program-a', 'program-b'],
      severity: 'medium',
      recommendation: 'Stagger Q3 cutovers',
    },
  };
}

function evidenceRecord(tenantKey: string, slug: string): TenantRecord {
  return {
    tenantKey,
    segmentId: 'evidence_ledger',
    recordKind: 'evidence_claim',
    recordId: `evidence_ledger:ev:${tenantKey}:${slug}`,
    title: `Claim — ${slug}`,
    sourceBasis: 'tenant_admin_upload',
    classification: 'confidential',
    payload: {
      claim: 'Tier-1 store NPS up 7 points YoY.',
      source_doc: 'doc:experience-2025-q3',
      confidence: 0.86,
    },
  };
}

function systemRecord(
  tenantKey: string,
  slug: string,
  title: string,
): TenantRecord {
  return {
    tenantKey,
    segmentId: 'it_landscape',
    recordKind: 'systems_inventory',
    recordId: `it_landscape:sys:${tenantKey}:${slug}`,
    title,
    sourceBasis: 'tenant_admin_upload',
    classification: 'confidential',
    payload: {
      vendor: title.includes('Snowflake') ? 'Snowflake' : 'Tableau',
      category: title.includes('Snowflake') ? 'Data Warehouse' : 'BI',
      domain: title.includes('Snowflake') ? 'Data' : 'Analytics',
      business_criticality: 'Critical',
      owner_id: 'person:apex:james-wright',
      renewal_date: '2026-11-30',
    },
  };
}

function apexSpec(): PersistedTenantSpec {
  return {
    tenantKey: 'apex-retail',
    segments: {
      org_structure: [
        personRecord('apex-retail', 'diana-lopez', 'CIO'),
        personRecord('apex-retail', 'marcus-chen', 'VP of Applications'),
      ],
      program_inventory: [
        programRecord('apex-retail', 'cdp-2026', 'Mobilize'),
        programRecord('apex-retail', 'contact-center-ai', 'Pilot'),
      ],
      cross_program_signals: [
        crossProgramSignalRecord('apex-retail', '001'),
      ],
      evidence_ledger: [evidenceRecord('apex-retail', '001')],
      it_landscape: [
        systemRecord('apex-retail', 'snowflake', 'Snowflake Data Cloud'),
        systemRecord('apex-retail', 'tableau', 'Tableau'),
      ],
    },
  };
}

function meridianSpec(): PersistedTenantSpec {
  return {
    tenantKey: 'meridian-health',
    segments: {
      org_structure: [personRecord('meridian-health', 'maya-ramos', 'CIO')],
      program_inventory: [
        programRecord('meridian-health', 'epic-uplift', 'Plan'),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildEnterpriseAgentContextBundleAsync — two-source consumer', () => {
  beforeEach(() => {
    fakeAdapter = makeEmptyAdapter();
  });

  it('emits person items sourced from persisted org_structure when the tenant has data', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const people = bundle.items.filter((i) => i.kind === 'person');
    expect(people.length).toBeGreaterThan(0);
    // Persisted items are tagged tenant_admin_upload by the mapper and
    // their ids carry the `tenant-data:` prefix from buildItem.
    expect(people.every((p) => p.id.startsWith('tenant-data:'))).toBe(true);
    expect(people.every((p) => p.sourceBasis === 'tenant_admin_upload')).toBe(true);
    expect(people.map((p) => p.title)).toEqual(
      expect.arrayContaining([
        'diana-lopez — CIO',
        'marcus-chen — VP of Applications',
      ]),
    );
  });

  it('emits cross_program_signal items from persisted cross_program_signals', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const signals = bundle.items.filter((i) => i.kind === 'cross_program_signal');
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].sourceBasis).toBe('tenant_admin_upload');
    expect(signals[0].summary).toMatch(/Stagger Q3 cutovers/);
  });

  it('emits program items from persisted program_inventory and skips the fixture path', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const programs = bundle.items.filter((i) => i.kind === 'program');
    expect(programs.length).toBeGreaterThan(0);
    // Persisted programs carry the `tenant-data:` id prefix; the
    // fixture path uses `ctx:`. Mixing would mean ids of both shapes
    // appear together — the never-mix-sources rule.
    expect(programs.every((p) => p.id.startsWith('tenant-data:'))).toBe(true);
    // Fixture artifact items are present in the apex-retail data
    // room; the persisted path must NOT emit them.
    const artifacts = bundle.items.filter((i) => i.kind === 'artifact');
    expect(artifacts).toHaveLength(0);
  });

  it('falls back to the fixture path when the tenant has no persisted data', async () => {
    // Default empty adapter — hasPersistedData(apex-retail) === false.
    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const people = bundle.items.filter((i) => i.kind === 'person');
    expect(people.length).toBeGreaterThan(0);
    // Fixture-sourced items use the `ctx:` id prefix.
    expect(people.every((p) => p.id.startsWith('ctx:'))).toBe(true);
  });

  it('tags the bundle warnings with the persisted source basis', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    expect(bundle.warnings).toContain(TENANT_DATA_PERSISTED_WARNING);
    expect(bundle.warnings).not.toContain(TENANT_DATA_FIXTURE_WARNING);
  });

  it('includes persisted it_landscape systems for Sentinel on Intelligence', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Sentinel',
      surface: 'intelligence',
    });

    const systems = bundle.items.filter((item) => item.kind === 'system');
    expect(systems.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Snowflake Data Cloud', 'Tableau']),
    );
    expect(systems.every((item) => item.id.startsWith('tenant-data:'))).toBe(true);
  });

  it('tags the bundle warnings with the fixture source basis when falling back', async () => {
    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    expect(bundle.warnings).toContain(TENANT_DATA_FIXTURE_WARNING);
    expect(bundle.warnings).not.toContain(TENANT_DATA_PERSISTED_WARNING);
  });

  it('isolates tenants — apex-retail bundle never includes meridian-health rows', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec(), meridianSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const persistedItems = bundle.items.filter((i) =>
      i.id.startsWith('tenant-data:'),
    );
    expect(persistedItems.length).toBeGreaterThan(0);
    expect(persistedItems.every((i) => i.tenantKey === 'apex-retail')).toBe(true);
    const ids = persistedItems.map((i) => i.id).join('\n');
    expect(ids).not.toMatch(/meridian/i);
    const provenance = persistedItems.flatMap((i) => i.provenanceIds).join('\n');
    expect(provenance).not.toMatch(/meridian/i);
  });

  it('falls back to fixture for tenants the adapter does not know about, even when other tenants have persisted data', async () => {
    fakeAdapter = makePersistedAdapter([meridianSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    expect(bundle.warnings).toContain(TENANT_DATA_FIXTURE_WARNING);
    const items = bundle.items.filter((i) => i.kind !== 'tenant_summary');
    expect(items.every((i) => i.id.startsWith('ctx:'))).toBe(true);
  });

  it('returns an unknown-tenant blocked bundle without consulting the adapter', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'unknown-tenant',
      agentName: 'Nexus',
      surface: 'programs',
    });

    expect(bundle.items).toHaveLength(0);
    expect(bundle.blockedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: 'unknown-tenant',
          reason: 'unknown_tenant',
        }),
      ]),
    );
  });

  it('always emits the tenant_summary item alongside the per-agent selection', async () => {
    fakeAdapter = makePersistedAdapter([apexSpec()]);

    const bundle = await buildEnterpriseAgentContextBundleAsync({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });

    const summaries = bundle.items.filter((i) => i.kind === 'tenant_summary');
    expect(summaries).toHaveLength(1);
  });
});
