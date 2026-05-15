// Unit tests for the parallel-run diff logic.
//
// Goal: feed the diff function two mock payloads that differ in known
// ways and assert the report shape matches expectations. This pins the
// invariant set and ensures a future field rename does not silently
// degrade the harness to "always pass."

import {
  buildInvariantReport,
  buildParallelRunDiff,
  countFailures,
  type BackendProbe,
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

// ---------------------------------------------------------------------------
// Founder-readable tri-state layer
// ---------------------------------------------------------------------------

function backend(
  label: string,
  overrides: Partial<BackendProbe> & {
    invariants?: InvariantPayload | null;
  } = {},
): BackendProbe {
  return {
    label,
    baseUrl: `https://${label}.example.com`,
    health: { reachable: true, status: 200, postgres: 'ok', error: null },
    invariants: overrides.invariants ?? null,
    invariantsStatus: overrides.invariantsStatus ?? null,
    invariantsError: overrides.invariantsError ?? null,
    authProbe: overrides.authProbe ?? {
      attempted: false,
      path: null,
      status: null,
      ok: false,
      error: null,
    },
    ...overrides,
  };
}

describe('buildParallelRunDiff', () => {
  it('runs the connectivity invariant with no auth and stays yellow when token absent', () => {
    const diff = buildParallelRunDiff({
      left: backend('prod'),
      right: backend('azure-lab'),
      tenantFilter: null,
      invariantTokenSupplied: false,
      authCookieSupplied: false,
    });
    // Connectivity always produces concrete pass rows.
    const connectivityPasses = diff.lines.filter(
      (l) => l.category === 'connectivity' && l.severity === 'pass',
    );
    expect(connectivityPasses.length).toBeGreaterThan(0);
    // Tenant facts + auth surface are blocked, not failed.
    expect(diff.verdict.fail).toBe(0);
    expect(diff.verdict.preflightBlocked).toBeGreaterThan(0);
    expect(diff.verdict.overall).toBe('yellow');
  });

  it('marks an unreachable backend health probe as a hard fail (red)', () => {
    const diff = buildParallelRunDiff({
      left: backend('prod'),
      right: backend('azure-lab', {
        health: { reachable: false, status: null, postgres: null, error: 'ECONNREFUSED' },
      }),
      tenantFilter: null,
      invariantTokenSupplied: false,
      authCookieSupplied: false,
    });
    expect(diff.verdict.fail).toBeGreaterThan(0);
    expect(diff.verdict.overall).toBe('red');
  });

  it('treats a 1-5 row count drift as warn, not fail', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail', nodes: 1313 })]);
    const b = payload([tenant({ tenantKey: 'apex-retail', nodes: 1316 })]);
    const diff = buildParallelRunDiff({
      left: backend('prod', { invariants: a, invariantsStatus: 200 }),
      right: backend('azure-lab', { invariants: b, invariantsStatus: 200 }),
      tenantFilter: null,
      invariantTokenSupplied: true,
      authCookieSupplied: false,
    });
    const nodesLine = diff.lines.find(
      (l) => l.tenantKey === 'apex-retail' && l.label === 'graph nodes',
    );
    expect(nodesLine?.severity).toBe('warn');
    expect(diff.verdict.fail).toBe(0);
  });

  it('treats a large row count drift as fail (red)', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail', nodes: 1313 })]);
    const b = payload([tenant({ tenantKey: 'apex-retail', nodes: 900 })]);
    const diff = buildParallelRunDiff({
      left: backend('prod', { invariants: a, invariantsStatus: 200 }),
      right: backend('azure-lab', { invariants: b, invariantsStatus: 200 }),
      tenantFilter: null,
      invariantTokenSupplied: true,
      authCookieSupplied: false,
    });
    const nodesLine = diff.lines.find(
      (l) => l.tenantKey === 'apex-retail' && l.label === 'graph nodes',
    );
    expect(nodesLine?.severity).toBe('fail');
    expect(diff.verdict.overall).toBe('red');
  });

  it('treats a top-3 KPI reorder as fail with no warn tolerance', () => {
    const a = payload([
      tenant({ tenantKey: 'apex-retail', topKpiNames: ['A', 'B', 'C'] }),
    ]);
    const b = payload([
      tenant({ tenantKey: 'apex-retail', topKpiNames: ['B', 'A', 'C'] }),
    ]);
    const diff = buildParallelRunDiff({
      left: backend('prod', { invariants: a, invariantsStatus: 200 }),
      right: backend('azure-lab', { invariants: b, invariantsStatus: 200 }),
      tenantFilter: null,
      invariantTokenSupplied: true,
      authCookieSupplied: false,
    });
    const kpiLine = diff.lines.find(
      (l) => l.tenantKey === 'apex-retail' && l.label === 'top-3 KPI names',
    );
    expect(kpiLine?.severity).toBe('fail');
  });

  it('honours the tenant filter', () => {
    const tenants = [
      tenant({ tenantKey: 'apex-retail' }),
      tenant({ tenantKey: 'meridian-health' }),
    ];
    const diff = buildParallelRunDiff({
      left: backend('prod', { invariants: payload(tenants), invariantsStatus: 200 }),
      right: backend('azure-lab', { invariants: payload(tenants), invariantsStatus: 200 }),
      tenantFilter: ['apex-retail'],
      invariantTokenSupplied: true,
      authCookieSupplied: false,
    });
    const tenantKeys = new Set(
      diff.lines.filter((l) => l.tenantKey).map((l) => l.tenantKey),
    );
    expect(tenantKeys.has('apex-retail')).toBe(true);
    expect(tenantKeys.has('meridian-health')).toBe(false);
  });

  it('marks a 403 on the invariants endpoint as preflight-blocked, not fail', () => {
    const a = payload([tenant({ tenantKey: 'apex-retail' })]);
    const diff = buildParallelRunDiff({
      left: backend('prod', { invariants: a, invariantsStatus: 200 }),
      right: backend('azure-lab', {
        invariants: null,
        invariantsStatus: 403,
        invariantsError: 'http_403',
      }),
      tenantFilter: null,
      invariantTokenSupplied: true,
      authCookieSupplied: false,
    });
    const blocked = diff.lines.find(
      (l) => l.category === 'tenant-fact' && l.severity === 'preflight-blocked',
    );
    expect(blocked).toBeDefined();
    expect(diff.verdict.fail).toBe(0);
  });

  it('is green when everything matches and all credentials are supplied', () => {
    const tenants = [tenant({ tenantKey: 'apex-retail' })];
    // Distinct backend markers so the same-backend guard does not warn.
    const leftPayload = { ...payload(tenants), backendMarker: 'prod-backend' };
    const rightPayload = { ...payload(tenants), backendMarker: 'azure-backend' };
    const diff = buildParallelRunDiff({
      left: backend('prod', {
        invariants: leftPayload,
        invariantsStatus: 200,
        authProbe: { attempted: true, path: '/intelligence', status: 200, ok: true, error: null },
      }),
      right: backend('azure-lab', {
        invariants: rightPayload,
        invariantsStatus: 200,
        authProbe: { attempted: true, path: '/intelligence', status: 200, ok: true, error: null },
      }),
      tenantFilter: null,
      invariantTokenSupplied: true,
      authCookieSupplied: true,
    });
    expect(diff.verdict.fail).toBe(0);
    expect(diff.verdict.warn).toBe(0);
    expect(diff.verdict.preflightBlocked).toBe(0);
    expect(diff.verdict.overall).toBe('green');
  });
});
