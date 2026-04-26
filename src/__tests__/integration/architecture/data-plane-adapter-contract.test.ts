// TEN4 - Data Plane Adapter Contract - integration tests.
//
// Pure deterministic coverage. The contract module is type-only and
// has no runtime side effects, so the tests assert:
//   - all 7 adapter shapes representable (relational_store,
//     object_store, vector_search, graph_provider, evidence_ledger,
//     model_gateway_provider, audit_store).
//   - byte-equal determinism (the seed is identical across repeated
//     calls; the summary is identical across repeated calls).
//   - per-adapter validation surfaces missing fields and bad
//     createdFrom tags.
//   - summarizeDataPlaneAdapters reconciles totals.
//   - module hygiene: no provider SDK import statements (with
//     stripStringLiterals so safety-constraint and env-var literals
//     do not produce false positives), no Date.now / Math.random /
//     new Date( / fetch(, no anthropic / openai imports, no imports
//     from @/lib/source/, @/lib/sentinel/, @/lib/atlas/, @/lib/nexus/,
//     @/lib/agent/, @/lib/auth/.

import {
  DATA_PLANE_ADAPTER_KINDS,
  DATA_PLANE_DEPLOYMENT_MODES,
  buildDataPlaneAdapterContractSeed,
  listDataPlaneAdapterKinds,
  listDataPlaneDeploymentModes,
  summarizeDataPlaneAdapters,
  validateDataPlaneAdapter,
  type AuditStoreAdapter,
  type DataPlaneAdapter,
  type DataPlaneAdapterKind,
  type EvidenceLedgerAdapter,
  type GraphProviderAdapter,
  type ModelGatewayProviderAdapter,
  type ObjectStoreAdapter,
  type RelationalStoreAdapter,
  type VectorSearchAdapter,
} from '@/lib/architecture/data-plane-adapter-contract';

// ---------------------------------------------------------------------
// Canonical tuples.
// ---------------------------------------------------------------------

describe('DATA_PLANE_ADAPTER_KINDS', () => {
  it('includes all 7 canonical adapter kinds', () => {
    expect(DATA_PLANE_ADAPTER_KINDS).toEqual([
      'relational_store',
      'object_store',
      'vector_search',
      'graph_provider',
      'evidence_ledger',
      'model_gateway_provider',
      'audit_store',
    ]);
    expect(DATA_PLANE_ADAPTER_KINDS).toHaveLength(7);
  });

  it('listDataPlaneAdapterKinds returns the canonical tuple', () => {
    expect(listDataPlaneAdapterKinds()).toEqual(DATA_PLANE_ADAPTER_KINDS);
  });
});

describe('DATA_PLANE_DEPLOYMENT_MODES', () => {
  it('includes the 3 canonical deployment modes', () => {
    expect(DATA_PLANE_DEPLOYMENT_MODES).toEqual([
      'shared_saas',
      'dedicated_tenant',
      'private_deployment',
    ]);
    expect(DATA_PLANE_DEPLOYMENT_MODES).toHaveLength(3);
  });

  it('listDataPlaneDeploymentModes returns the canonical tuple', () => {
    expect(listDataPlaneDeploymentModes()).toEqual(
      DATA_PLANE_DEPLOYMENT_MODES,
    );
  });
});

// ---------------------------------------------------------------------
// All 7 adapter shapes representable.
// ---------------------------------------------------------------------

describe('all 7 adapter shapes are representable', () => {
  const seed = buildDataPlaneAdapterContractSeed();

  function findByKind<K extends DataPlaneAdapterKind>(
    kind: K,
  ): DataPlaneAdapter & { kind: K } {
    const found = seed.find((adapter) => adapter.kind === kind);
    expect(found).toBeDefined();
    return found as DataPlaneAdapter & { kind: K };
  }

  it('seed contains exactly one entry per canonical adapter kind', () => {
    expect(seed).toHaveLength(DATA_PLANE_ADAPTER_KINDS.length);
    const kinds = seed.map((adapter) => adapter.kind).sort();
    const expected = [...DATA_PLANE_ADAPTER_KINDS].sort();
    expect(kinds).toEqual(expected);
  });

  it('relational_store adapter shape is fully populated', () => {
    const adapter = findByKind('relational_store') as RelationalStoreAdapter;
    expect(adapter.kind).toBe('relational_store');
    expect(typeof adapter.provider).toBe('string');
    expect(adapter.provider.length).toBeGreaterThan(0);
    expect(adapter.capabilities.length).toBeGreaterThan(0);
    expect(adapter.requiredEnvVars.length).toBeGreaterThan(0);
    expect(adapter.safetyConstraints.length).toBeGreaterThan(0);
    expect(typeof adapter.rowLevelSecurity).toBe('boolean');
    expect([
      'per_tenant_database',
      'per_tenant_schema',
      'row_scoped_on_tenant_id',
    ]).toContain(adapter.tenantBindingStrategy);
    expect(adapter.createdFrom).toBe(
      'deterministic_data_plane_adapter_contract_seed',
    );
  });

  it('object_store adapter shape is fully populated', () => {
    const adapter = findByKind('object_store') as ObjectStoreAdapter;
    expect(adapter.kind).toBe('object_store');
    expect(typeof adapter.publicNetworkAccessDisabled).toBe('boolean');
    expect([
      'dedicated_bucket_per_tenant',
      'dedicated_prefix_per_tenant',
      'signed_url_only',
    ]).toContain(adapter.accessStrategy);
  });

  it('vector_search adapter shape is fully populated', () => {
    const adapter = findByKind('vector_search') as VectorSearchAdapter;
    expect(adapter.kind).toBe('vector_search');
    expect(adapter.tenantKeyRequired).toBe(true);
    expect([
      'per_tenant_namespace',
      'dedicated_index_per_tenant',
      'row_scoped_pgvector',
    ]).toContain(adapter.namespaceStrategy);
  });

  it('graph_provider adapter shape is fully populated', () => {
    const adapter = findByKind('graph_provider') as GraphProviderAdapter;
    expect(adapter.kind).toBe('graph_provider');
    expect(adapter.tenantPredicateRequired).toBe(true);
    expect([
      'per_tenant_graph_namespace',
      'dedicated_graph_database_per_tenant',
      'row_scoped_edge_table',
    ]).toContain(adapter.storageStrategy);
  });

  it('evidence_ledger adapter shape is fully populated', () => {
    const adapter = findByKind('evidence_ledger') as EvidenceLedgerAdapter;
    expect(adapter.kind).toBe('evidence_ledger');
    expect(adapter.tenantKeyOnEveryEntry).toBe(true);
    expect([
      'tenant_contracted_retention',
      'default_365_day_retention',
      'per_evidence_retention',
    ]).toContain(adapter.retentionStrategy);
  });

  it('model_gateway_provider adapter shape is fully populated', () => {
    const adapter = findByKind(
      'model_gateway_provider',
    ) as ModelGatewayProviderAdapter;
    expect(adapter.kind).toBe('model_gateway_provider');
    expect(adapter.routesThroughAbarvaGateway).toBe(true);
    expect([
      'per_tenant_allowlist',
      'shared_image_with_tenant_routing',
      'local_only',
    ]).toContain(adapter.tierPolicy);
  });

  it('audit_store adapter shape is fully populated', () => {
    const adapter = findByKind('audit_store') as AuditStoreAdapter;
    expect(adapter.kind).toBe('audit_store');
    expect(adapter.tenantKeyOnEveryRow).toBe(true);
    expect([
      'dedicated_tenant_stream',
      'row_scoped_shared_ledger',
      'append_only_ledger',
    ]).toContain(adapter.boundaryStrategy);
  });
});

// ---------------------------------------------------------------------
// Byte-equal determinism.
// ---------------------------------------------------------------------

describe('byte-equal determinism', () => {
  it('buildDataPlaneAdapterContractSeed returns byte-equal JSON across calls', () => {
    const a = JSON.stringify(buildDataPlaneAdapterContractSeed());
    const b = JSON.stringify(buildDataPlaneAdapterContractSeed());
    expect(a).toBe(b);
  });

  it('summarizeDataPlaneAdapters returns byte-equal JSON across calls', () => {
    const a = JSON.stringify(summarizeDataPlaneAdapters());
    const b = JSON.stringify(summarizeDataPlaneAdapters());
    expect(a).toBe(b);
  });

  it('summary reconciles totals against the seed', () => {
    const seed = buildDataPlaneAdapterContractSeed();
    const summary = summarizeDataPlaneAdapters(seed);
    expect(summary.totalAdapters).toBe(seed.length);
    expect(summary.adapterKindsCovered.length).toBe(
      DATA_PLANE_ADAPTER_KINDS.length,
    );
    let envVarTotal = 0;
    let safetyTotal = 0;
    for (const adapter of seed) {
      envVarTotal += adapter.requiredEnvVars.length;
      safetyTotal += adapter.safetyConstraints.length;
      expect(summary.adaptersByKind[adapter.kind]).toBeGreaterThanOrEqual(1);
      expect(summary.providersByKind[adapter.kind]).toContain(adapter.provider);
    }
    expect(summary.totalRequiredEnvVars).toBe(envVarTotal);
    expect(summary.totalSafetyConstraints).toBe(safetyTotal);
  });
});

// ---------------------------------------------------------------------
// validateDataPlaneAdapter.
// ---------------------------------------------------------------------

describe('validateDataPlaneAdapter', () => {
  const seed = buildDataPlaneAdapterContractSeed();

  it('every seed adapter validates clean', () => {
    for (const adapter of seed) {
      const result = validateDataPlaneAdapter(adapter);
      expect(result.isValid).toBe(true);
      expect(result.findings).toHaveLength(0);
    }
  });

  it('rejects an adapter with empty provider', () => {
    const broken: DataPlaneAdapter = {
      ...(seed[0] as RelationalStoreAdapter),
      provider: '',
    };
    const result = validateDataPlaneAdapter(broken);
    expect(result.isValid).toBe(false);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('rejects an adapter with empty capabilities', () => {
    const broken: DataPlaneAdapter = {
      ...(seed[0] as RelationalStoreAdapter),
      capabilities: [],
    };
    const result = validateDataPlaneAdapter(broken);
    expect(result.isValid).toBe(false);
  });

  it('rejects an adapter with empty requiredEnvVars', () => {
    const broken: DataPlaneAdapter = {
      ...(seed[0] as RelationalStoreAdapter),
      requiredEnvVars: [],
    };
    const result = validateDataPlaneAdapter(broken);
    expect(result.isValid).toBe(false);
  });

  it('rejects an adapter with empty safetyConstraints', () => {
    const broken: DataPlaneAdapter = {
      ...(seed[0] as RelationalStoreAdapter),
      safetyConstraints: [],
    };
    const result = validateDataPlaneAdapter(broken);
    expect(result.isValid).toBe(false);
  });

  it('rejects an adapter with wrong createdFrom tag', () => {
    const broken = {
      ...(seed[0] as RelationalStoreAdapter),
      createdFrom: 'live_runtime' as unknown as
        'deterministic_data_plane_adapter_contract_seed',
    } as DataPlaneAdapter;
    const result = validateDataPlaneAdapter(broken);
    expect(result.isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------
// Module hygiene.
// ---------------------------------------------------------------------

describe('module hygiene - data-plane-adapter-contract.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/data-plane-adapter-contract.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Strip block comments, line comments, and string literals so
  // hygiene assertions fire on real code only. The seed adapter
  // entries legitimately contain provider names and safety-constraint
  // strings; we must scan code, not data.
  function stripStringLiterals(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  const codeOnly = stripStringLiterals(source);

  it('does not import any provider SDK', () => {
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'openai'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'anthropic'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@anthropic-ai\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@openai\/[^']+'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'aws-sdk'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@azure\/[^']+'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@google-cloud\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'pg'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'pinecone'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'neo4j-driver'/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/supabase/);
  });

  it('does not call Date.now / Math.random / new Date(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch( or reference live SDK names in code', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/\banthropic\b/i);
    expect(codeOnly).not.toMatch(/\bopenai\b/i);
  });

  it('does not import from forbidden agent / source runtimes', () => {
    expect(source).not.toMatch(/from\s+'@\/lib\/sentinel\b/);
    expect(source).not.toMatch(/from\s+'@\/lib\/atlas\b/);
    expect(source).not.toMatch(/from\s+'@\/lib\/nexus\b/);
    expect(source).not.toMatch(/from\s+'@\/lib\/agent\b/);
    expect(source).not.toMatch(/from\s+'@\/lib\/source\b/);
    expect(source).not.toMatch(/from\s+'@\/lib\/auth\b/);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not contain placeholder copy', () => {
    expect(codeOnly).not.toMatch(/Coming soon/);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/);
  });
});
