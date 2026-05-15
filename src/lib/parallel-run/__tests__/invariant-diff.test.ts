// Unit tests for the parallel-run diff logic.
//
// Goal: feed the diff function two mock payloads that differ in known
// ways and assert the report shape matches expectations. This pins the
// invariant set and ensures a future field rename does not silently
// degrade the harness to "always pass."

import {
  buildInvariantReport,
  countFailures,
  type InvariantPayload,
  type TenantInvariants,
} from '../invariant-diff';

function tenant(
  overrides: Partial<TenantInvariants> & { tenantKey: string },
): TenantInvariants {
  const base: TenantInvariants = {
    tenantKey: overrides.tenantKey,
    clientId: 'client-uuid',
    clientName: overrides.tenantKey,
    nodes: 100,
    edges: 200,
    contextChunks: 1000,
    segments: 14,
    programs: 4,
    topKpiNames: ['Revenue', 'Margin', 'NPS'],
    topPatternIds: ['P-001', 'P-002', 'P-003'],
    sourceEvents: 20,
  };
  return { ...base, ...overrides };
}

function payload(tenants: TenantInvariants[]): InvariantPayload {
  return {
    schemaVersion: 1,
    generatedAt: '2026-05-15T00:00:00Z',
    backendMarker: 'test-backend',
    tenants,
    totals: {
      nodes: tenants.reduce((s, t) => s + t.nodes, 0),
      edges: tenants.reduce((s, t) => s + t.edges, 0),
      contextChunks: tenants.reduce((s, t) => s + t.contextChunks, 0),
      programs: tenants.reduce((s, t) => s + t.programs, 0),
    },
  };
}

describe('buildInvariantReport', () => {
  it('reports zero failures when both payloads are identical', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail' })]);
    const b = payload([tenant({ tenantKey: 'apex-retail' })]);
    const report = buildInvariantReport(a, b);
    expect(countFailures(report)).toBe(0);
    expect(report.matched).toBe(report.total);
    // Sanity: we are exercising all 8 invariants, not a degenerate subset.
    expect(report.total).toBe(8);
  });

  it('flags a node-count drift as a failing invariant', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail', nodes: 100 })]);
    const b = payload([tenant({ tenantKey: 'apex-retail', nodes: 101 })]);
    const report = buildInvariantReport(a, b);
    expect(countFailures(report)).toBe(1);
    const row = report.perTenant.find((r) => r.tenantKey === 'apex-retail');
    expect(row?.checks.nodes?.matched).toBe(false);
    expect(row?.checks.nodes?.a).toBe(100);
    expect(row?.checks.nodes?.b).toBe(101);
    // The other 7 should still pass.
    expect(row?.checks.edges?.matched).toBe(true);
    expect(row?.checks.topKpiNames?.matched).toBe(true);
  });

  it('flags top-3 KPI name reorder as a failure (order matters)', () => {
    const a = payload([
      tenant({ tenantKey: 'meridian-health', topKpiNames: ['A', 'B', 'C'] }),
    ]);
    const b = payload([
      tenant({ tenantKey: 'meridian-health', topKpiNames: ['B', 'A', 'C'] }),
    ]);
    const report = buildInvariantReport(a, b);
    const row = report.perTenant[0];
    expect(row.checks.topKpiNames?.matched).toBe(false);
    expect(countFailures(report)).toBe(1);
  });

  it('skips tenants present on only one side', () => {
    const a = payload([
      tenant({ tenantKey: 'apex-retail' }),
      tenant({ tenantKey: 'meridian-health' }),
    ]);
    const b = payload([tenant({ tenantKey: 'apex-retail' })]);
    const report = buildInvariantReport(a, b);
    expect(report.perTenant).toHaveLength(1);
    expect(report.skipped.some((s) => s.includes('meridian-health'))).toBe(true);
  });

  it('returns an empty report when one side is null', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail' })]);
    const report = buildInvariantReport(a, null);
    expect(report.total).toBe(0);
    expect(report.matched).toBe(0);
    expect(report.perTenant).toHaveLength(0);
    expect(report.skipped.length).toBeGreaterThan(0);
  });

  it('counts multiple failures across multiple tenants', () => {
    const a = payload([
      tenant({ tenantKey: 'apex-retail', nodes: 100, programs: 4 }),
      tenant({ tenantKey: 'meridian-health', edges: 200 }),
    ]);
    const b = payload([
      tenant({ tenantKey: 'apex-retail', nodes: 99, programs: 5 }),
      tenant({ tenantKey: 'meridian-health', edges: 199 }),
    ]);
    const report = buildInvariantReport(a, b);
    expect(countFailures(report)).toBe(3);
  });
});
