// TEN2 - Tenant Isolation Data Boundary Model tests.
//
// Deterministic, file-pure suite. No network calls, no model
// providers, no migrations, no time-of-day dependence, no auth import.

import {
  TENANT_ISOLATION_LEVELS,
  buildTenantDataBoundaryModel,
  listTenantIsolationLevels,
  summarizeTenantIsolationBoundaries,
  validateTenantBoundary,
  type TenantDataBoundary,
  type TenantIsolationLevel,
  type TenantStorageBoundary,
} from '@/lib/architecture/tenant-isolation-boundary';

// ---------------------------------------------------------------------
// Determinism + shape
// ---------------------------------------------------------------------

describe('buildTenantDataBoundaryModel · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildTenantDataBoundaryModel());
    const second = JSON.stringify(buildTenantDataBoundaryModel());
    const third = JSON.stringify(buildTenantDataBoundaryModel());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('returns at least one boundary per kind and at least 5 in total', () => {
    const boundaries = buildTenantDataBoundaryModel();
    expect(boundaries.length).toBeGreaterThanOrEqual(5);
    const kinds = new Set(boundaries.map((boundary) => boundary.kind));
    expect(kinds.has('storage')).toBe(true);
    expect(kinds.has('vector')).toBe(true);
    expect(kinds.has('graph')).toBe(true);
    expect(kinds.has('model_gateway')).toBe(true);
    expect(kinds.has('audit')).toBe(true);
  });

  it('every boundary is tagged createdFrom: deterministic_tenant_isolation_seed', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      expect(boundary.createdFrom).toBe('deterministic_tenant_isolation_seed');
    }
  });

  it('every boundary id is unique', () => {
    const boundaries = buildTenantDataBoundaryModel();
    const ids = boundaries.map((boundary) => boundary.id);
    expect(new Set(ids).size).toBe(boundaries.length);
  });
});

// ---------------------------------------------------------------------
// Isolation level coverage
// ---------------------------------------------------------------------

describe('TenantIsolationLevel ladder', () => {
  it('canonical isolation level tuple is in canonical order with 5 entries', () => {
    expect(TENANT_ISOLATION_LEVELS).toEqual([
      'logical_row_level',
      'schema_isolated',
      'database_isolated',
      'environment_isolated',
      'customer_private_data_plane',
    ]);
    expect(TENANT_ISOLATION_LEVELS.length).toBe(5);
  });

  it('listTenantIsolationLevels returns the canonical tuple', () => {
    expect(listTenantIsolationLevels()).toEqual(TENANT_ISOLATION_LEVELS);
  });

  it('every canonical isolation level appears at least once across the seed', () => {
    const boundaries = buildTenantDataBoundaryModel();
    const levels = new Set(boundaries.map((boundary) => boundary.isolationLevel));
    for (const level of TENANT_ISOLATION_LEVELS) {
      expect(levels.has(level)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-boundary invariants
// ---------------------------------------------------------------------

describe('per-boundary invariants', () => {
  it('every boundary has non-empty id, label, surface, risk, mitigation, auditRequirement', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      expect(boundary.id.length).toBeGreaterThan(0);
      expect(boundary.label.length).toBeGreaterThan(0);
      expect(boundary.surface.length).toBeGreaterThan(0);
      expect(boundary.risk.length).toBeGreaterThan(0);
      expect(boundary.mitigation.length).toBeGreaterThan(0);
      expect(boundary.auditRequirement.length).toBeGreaterThan(0);
    }
  });

  it('every boundary records a known isolation level', () => {
    const allowed = new Set<TenantIsolationLevel>(TENANT_ISOLATION_LEVELS);
    for (const boundary of buildTenantDataBoundaryModel()) {
      expect(allowed.has(boundary.isolationLevel)).toBe(true);
    }
  });

  it('storage boundaries declare a tenant_key column', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      if (boundary.kind !== 'storage') continue;
      expect(boundary.tenantKeyColumn.length).toBeGreaterThan(0);
      expect(boundary.store.length).toBeGreaterThan(0);
    }
  });

  it('vector boundaries declare a mandatory filter field', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      if (boundary.kind !== 'vector') continue;
      expect(boundary.mandatoryFilterField.length).toBeGreaterThan(0);
      expect(boundary.indexFamily.length).toBeGreaterThan(0);
    }
  });

  it('graph boundaries declare a tenant property name', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      if (boundary.kind !== 'graph') continue;
      expect(boundary.tenantPropertyName.length).toBeGreaterThan(0);
      expect(boundary.graphFamily.length).toBeGreaterThan(0);
    }
  });

  it('model_gateway boundaries require tenantKey on every invocation', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      if (boundary.kind !== 'model_gateway') continue;
      expect(boundary.tenantKeyRequiredOnInvocation).toBe(true);
      expect(boundary.rejectEmptyTenantKey).toBe(true);
    }
  });

  it('audit boundaries list at least one tenant-scoped event type', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      if (boundary.kind !== 'audit') continue;
      expect(Array.isArray(boundary.tenantScopedEventTypes)).toBe(true);
      expect(boundary.tenantScopedEventTypes.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

describe('validateTenantBoundary', () => {
  const sampleStorage = (): TenantStorageBoundary => ({
    kind: 'storage',
    id: 'storage-test',
    label: 'storage test',
    surface: 'persistence.test',
    store: 'postgres.test',
    rowLevelSecurityRequired: true,
    tenantKeyColumn: 'tenant_key',
    isolationLevel: 'logical_row_level',
    status: 'contract_only',
    risk: 'risk',
    mitigation: 'mitigation',
    auditRequirement: 'audit requirement',
    createdFrom: 'deterministic_tenant_isolation_seed',
  });

  it('every seed boundary passes validation', () => {
    for (const boundary of buildTenantDataBoundaryModel()) {
      const result = validateTenantBoundary(boundary);
      expect(result.findings.filter((finding) => finding.severity === 'error')).toEqual([]);
      expect(result.isValid).toBe(true);
    }
  });

  it('rejects a boundary with missing risk', () => {
    const boundary = { ...sampleStorage(), risk: '' };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(result.findings.some((f) => f.reason.includes('risk'))).toBe(true);
  });

  it('rejects a boundary with missing mitigation', () => {
    const boundary = { ...sampleStorage(), mitigation: '' };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(result.findings.some((f) => f.reason.includes('mitigation'))).toBe(true);
  });

  it('rejects a boundary with missing auditRequirement', () => {
    const boundary = { ...sampleStorage(), auditRequirement: '' };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(result.findings.some((f) => f.reason.includes('auditRequirement'))).toBe(true);
  });

  it('rejects an unknown isolation level', () => {
    const boundary = {
      ...sampleStorage(),
      isolationLevel: 'no_such_level' as unknown as TenantIsolationLevel,
    };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(result.findings.some((f) => f.reason.includes('isolationLevel'))).toBe(true);
  });

  it('rejects an unknown status', () => {
    const boundary = {
      ...sampleStorage(),
      status: 'speculative' as unknown as TenantStorageBoundary['status'],
    };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(result.findings.some((f) => f.reason.includes('status'))).toBe(true);
  });

  it('rejects a model_gateway boundary that does not require tenantKey', () => {
    const boundary: TenantDataBoundary = {
      kind: 'model_gateway',
      id: 'gateway-bad',
      label: 'bad gateway',
      surface: 'model_gateway.invocation',
      tenantKeyRequiredOnInvocation: false,
      rejectEmptyTenantKey: true,
      isolationLevel: 'environment_isolated',
      status: 'contract_only',
      risk: 'risk',
      mitigation: 'mitigation',
      auditRequirement: 'audit',
      createdFrom: 'deterministic_tenant_isolation_seed',
    };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('tenantKey')),
    ).toBe(true);
  });

  it('rejects an audit boundary with no tenantScopedEventTypes', () => {
    const boundary: TenantDataBoundary = {
      kind: 'audit',
      id: 'audit-bad',
      label: 'bad audit',
      surface: 'audit.unified-events',
      tenantScopedEventTypes: [],
      isolationLevel: 'logical_row_level',
      status: 'contract_only',
      risk: 'risk',
      mitigation: 'mitigation',
      auditRequirement: 'audit',
      createdFrom: 'deterministic_tenant_isolation_seed',
    };
    const result = validateTenantBoundary(boundary);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('tenantScopedEventType')),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeTenantIsolationBoundaries', () => {
  it('totalBoundaries matches input length', () => {
    const boundaries = buildTenantDataBoundaryModel();
    const summary = summarizeTenantIsolationBoundaries(boundaries);
    expect(summary.totalBoundaries).toBe(boundaries.length);
  });

  it('byKind reconciles to totalBoundaries', () => {
    const summary = summarizeTenantIsolationBoundaries(buildTenantDataBoundaryModel());
    const sum = (Object.values(summary.byKind) as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalBoundaries);
  });

  it('byIsolationLevel reconciles to totalBoundaries', () => {
    const summary = summarizeTenantIsolationBoundaries(buildTenantDataBoundaryModel());
    const sum = (Object.values(summary.byIsolationLevel) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(summary.totalBoundaries);
  });

  it('byStatus reconciles to totalBoundaries', () => {
    const summary = summarizeTenantIsolationBoundaries(buildTenantDataBoundaryModel());
    const sum = (Object.values(summary.byStatus) as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalBoundaries);
  });

  it('boundariesWithAuditRequirement equals total since every seed boundary defines one', () => {
    const boundaries = buildTenantDataBoundaryModel();
    const summary = summarizeTenantIsolationBoundaries(boundaries);
    expect(summary.boundariesWithAuditRequirement).toBe(boundaries.length);
  });

  it('boundariesWithMitigation equals total since every seed boundary defines one', () => {
    const boundaries = buildTenantDataBoundaryModel();
    const summary = summarizeTenantIsolationBoundaries(boundaries);
    expect(summary.boundariesWithMitigation).toBe(boundaries.length);
  });

  it('exposes every canonical isolation level key on byIsolationLevel', () => {
    const summary = summarizeTenantIsolationBoundaries(buildTenantDataBoundaryModel());
    for (const level of TENANT_ISOLATION_LEVELS) {
      expect(typeof summary.byIsolationLevel[level]).toBe('number');
    }
  });

  it('defaults to summarizing the canonical seed when called with no arguments', () => {
    const explicit = summarizeTenantIsolationBoundaries(buildTenantDataBoundaryModel());
    const implicit = summarizeTenantIsolationBoundaries();
    expect(JSON.stringify(implicit)).toBe(JSON.stringify(explicit));
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · tenant-isolation-boundary.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/tenant-isolation-boundary.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import auth / supabase / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
  });

  it('does not import migrations or supabase migrations directory', () => {
    expect(codeOnly).not.toMatch(/supabase\/migrations/);
    expect(codeOnly).not.toMatch(/from 'supabase'/);
    expect(codeOnly).not.toMatch(/from '@supabase\//);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not invent dollar amounts', () => {
    const serialized = JSON.stringify(buildTenantDataBoundaryModel());
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not claim production tenant isolation is complete', () => {
    const serialized = JSON.stringify(buildTenantDataBoundaryModel()).toLowerCase();
    expect(serialized).not.toMatch(/production tenant isolation is complete/);
    expect(serialized).not.toMatch(/production_ready/);
    expect(serialized).not.toMatch(/fully enforced in production/);
  });

  it('does not invent live runtime claims for vendor models', () => {
    const serialized = JSON.stringify(buildTenantDataBoundaryModel());
    expect(serialized).not.toMatch(/openai/i);
    expect(serialized).not.toMatch(/anthropic/i);
    expect(serialized).not.toMatch(/cohere/i);
    expect(serialized).not.toMatch(/databricks/i);
  });
});
