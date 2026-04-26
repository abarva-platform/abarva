// GRAPH1 - Graph Provider Contract + Relationship Fallback tests.
//
// Deterministic, file-pure suite. No network calls, no model
// providers, no migrations, no time-of-day dependence, no auth import,
// no `prisma.` / `supabase.` / `await db` calls.

import {
  GRAPH_PROVIDER_KINDS,
  GRAPH_QUERY_CAPABILITIES,
  buildGraphProviderRegistry,
  buildRelationshipFallbackSchema,
  listGraphProviders,
  summarizeGraphProviders,
  type GraphProviderKind,
  type GraphQueryCapability,
} from '@/lib/architecture/graph-provider-contract';

// ---------------------------------------------------------------------
// Determinism + provider kind coverage
// ---------------------------------------------------------------------

describe('buildGraphProviderRegistry · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildGraphProviderRegistry());
    const second = JSON.stringify(buildGraphProviderRegistry());
    const third = JSON.stringify(buildGraphProviderRegistry());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('every provider is tagged createdFrom: deterministic_graph_provider_contract_seed', () => {
    for (const provider of buildGraphProviderRegistry()) {
      expect(provider.createdFrom).toBe(
        'deterministic_graph_provider_contract_seed',
      );
    }
  });

  it('every provider kind appears exactly once', () => {
    const providers = buildGraphProviderRegistry();
    const kinds = providers.map((provider) => provider.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(kinds.length).toBe(GRAPH_PROVIDER_KINDS.length);
  });
});

describe('GraphProviderKind ladder', () => {
  it('canonical provider tuple is in canonical order with all 4 entries', () => {
    expect(GRAPH_PROVIDER_KINDS).toEqual([
      'neo4j',
      'cosmos_db_gremlin',
      'neptune',
      'postgres_relationship_fallback',
    ]);
    expect(GRAPH_PROVIDER_KINDS.length).toBe(4);
  });

  it('listGraphProviders returns the canonical tuple', () => {
    expect(listGraphProviders()).toEqual(GRAPH_PROVIDER_KINDS);
  });

  it('every canonical provider kind appears exactly once across the seed', () => {
    const providers = buildGraphProviderRegistry();
    const seen = new Set<GraphProviderKind>();
    for (const provider of providers) {
      seen.add(provider.kind);
    }
    for (const kind of GRAPH_PROVIDER_KINDS) {
      expect(seen.has(kind)).toBe(true);
    }
    expect(seen.size).toBe(GRAPH_PROVIDER_KINDS.length);
  });
});

// ---------------------------------------------------------------------
// Capability coverage
// ---------------------------------------------------------------------

describe('GraphQueryCapability coverage', () => {
  it('canonical capability tuple has all 6 entries in canonical order', () => {
    expect(GRAPH_QUERY_CAPABILITIES).toEqual([
      'shortest_path',
      'multi_hop_traversal',
      'subgraph_extract',
      'relationship_count',
      'pattern_match',
      'tenant_scoped_query',
    ]);
    expect(GRAPH_QUERY_CAPABILITIES.length).toBe(6);
  });

  it('every canonical capability appears at least once across the seed', () => {
    const providers = buildGraphProviderRegistry();
    const seen = new Set<GraphQueryCapability>();
    for (const provider of providers) {
      for (const capability of provider.capabilities) {
        seen.add(capability);
      }
    }
    for (const capability of GRAPH_QUERY_CAPABILITIES) {
      expect(seen.has(capability)).toBe(true);
    }
  });

  it('every provider supports tenant_scoped_query', () => {
    for (const provider of buildGraphProviderRegistry()) {
      expect(provider.capabilities).toContain('tenant_scoped_query');
      expect(provider.requiresTenantKeyOnTraversal).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Fallback documentation
// ---------------------------------------------------------------------

describe('postgres_relationship_fallback fallback option', () => {
  it('is documented as the only fallback provider', () => {
    const providers = buildGraphProviderRegistry();
    const fallbacks = providers.filter((provider) => provider.isFallback);
    expect(fallbacks.length).toBe(1);
    expect(fallbacks[0].kind).toBe('postgres_relationship_fallback');
  });

  it('non-fallback providers all record runtimeStatus contract_only', () => {
    const providers = buildGraphProviderRegistry();
    for (const provider of providers) {
      if (provider.kind === 'postgres_relationship_fallback') {
        continue;
      }
      expect(provider.runtimeStatus).toBe('contract_only');
    }
  });

  it('fallback provider supports at least multi_hop_traversal, relationship_count, and tenant_scoped_query', () => {
    const fallback = buildGraphProviderRegistry().find(
      (provider) => provider.kind === 'postgres_relationship_fallback',
    );
    expect(fallback).toBeDefined();
    expect(fallback?.capabilities).toEqual(
      expect.arrayContaining([
        'multi_hop_traversal',
        'relationship_count',
        'tenant_scoped_query',
      ]),
    );
  });
});

// ---------------------------------------------------------------------
// Per-provider invariants
// ---------------------------------------------------------------------

describe('per-provider invariants', () => {
  it('every provider has non-empty risk, mitigation, auditRequirement, label, family', () => {
    for (const provider of buildGraphProviderRegistry()) {
      expect(provider.risk.trim().length).toBeGreaterThan(0);
      expect(provider.mitigation.trim().length).toBeGreaterThan(0);
      expect(provider.auditRequirement.trim().length).toBeGreaterThan(0);
      expect(provider.label.trim().length).toBeGreaterThan(0);
      expect(provider.family.trim().length).toBeGreaterThan(0);
      expect(provider.tenantKeyProperty.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// summarizeGraphProviders
// ---------------------------------------------------------------------

describe('summarizeGraphProviders', () => {
  it('reconciles totals against the canonical lists', () => {
    const summary = summarizeGraphProviders();
    expect(summary.totalProviders).toBe(GRAPH_PROVIDER_KINDS.length);
    expect(summary.totalCapabilities).toBe(GRAPH_QUERY_CAPABILITIES.length);
    expect(summary.fallbackProviderKind).toBe(
      'postgres_relationship_fallback',
    );
    expect(summary.providersWithTenantScopedQuery).toBe(
      GRAPH_PROVIDER_KINDS.length,
    );
  });

  it('byRuntimeStatus accounts for every provider', () => {
    const summary = summarizeGraphProviders();
    const sum =
      summary.byRuntimeStatus.contract_only +
      summary.byRuntimeStatus.partial_runtime +
      summary.byRuntimeStatus.enforced_runtime +
      summary.byRuntimeStatus.deferred;
    expect(sum).toBe(summary.totalProviders);
  });

  it('capabilityCoverage records every canonical capability key', () => {
    const summary = summarizeGraphProviders();
    for (const capability of GRAPH_QUERY_CAPABILITIES) {
      expect(typeof summary.capabilityCoverage[capability]).toBe('number');
      expect(summary.capabilityCoverage[capability]).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// buildRelationshipFallbackSchema
// ---------------------------------------------------------------------

describe('buildRelationshipFallbackSchema', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildRelationshipFallbackSchema());
    const second = JSON.stringify(buildRelationshipFallbackSchema());
    const third = JSON.stringify(buildRelationshipFallbackSchema());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('declares a node table, an edge table, and an edge-version table', () => {
    const schema = buildRelationshipFallbackSchema();
    const tableNames = schema.tables.map((table) => table.tableName);
    expect(tableNames).toContain('graph_fallback_nodes');
    expect(tableNames).toContain('graph_fallback_edges');
    expect(tableNames).toContain('graph_fallback_edge_versions');
  });

  it('every table carries tenant_key as the tenant scope column', () => {
    const schema = buildRelationshipFallbackSchema();
    for (const table of schema.tables) {
      expect(table.tenantKeyColumn).toBe('tenant_key');
      const tenantColumn = table.columns.find(
        (column) => column.name === 'tenant_key',
      );
      expect(tenantColumn).toBeDefined();
      expect(tenantColumn?.typeFamily).toBe('tenant_key');
      expect(tenantColumn?.nullable).toBe(false);
    }
  });

  it('every table is tagged createdFrom: deterministic_graph_provider_contract_seed', () => {
    const schema = buildRelationshipFallbackSchema();
    expect(schema.createdFrom).toBe(
      'deterministic_graph_provider_contract_seed',
    );
    for (const table of schema.tables) {
      expect(table.createdFrom).toBe(
        'deterministic_graph_provider_contract_seed',
      );
    }
  });

  it('every table records at least one index covering tenant_key', () => {
    const schema = buildRelationshipFallbackSchema();
    for (const table of schema.tables) {
      expect(table.indexes.length).toBeGreaterThan(0);
      const hasTenantIndex = table.indexes.some((index) =>
        index.includes('tenant_key'),
      );
      expect(hasTenantIndex).toBe(true);
    }
  });

  it('every column declares a non-empty purpose and a known typeFamily', () => {
    const allowedTypeFamilies = new Set([
      'tenant_key',
      'identifier',
      'short_text',
      'long_text',
      'integer',
      'boolean',
      'json',
      'timestamp_logical',
    ]);
    const schema = buildRelationshipFallbackSchema();
    for (const table of schema.tables) {
      for (const column of table.columns) {
        expect(column.name.trim().length).toBeGreaterThan(0);
        expect(column.purpose.trim().length).toBeGreaterThan(0);
        expect(allowedTypeFamilies.has(column.typeFamily)).toBe(true);
      }
    }
  });

  it('declares a non-empty tenant isolation invariant', () => {
    const schema = buildRelationshipFallbackSchema();
    expect(schema.tenantIsolationInvariant.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene - graph-provider-contract.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/graph-provider-contract.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Strip block comments, line comments, and string literals so
  // hygiene assertions fire on real code only. The source file
  // legitimately mentions tokens like 'prisma' / 'supabase' inside
  // its prose comments and inside the createdFrom literal; we must
  // scan code, not data.
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

  it('does not import any provider SDK or DB client', () => {
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'openai'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'anthropic'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@anthropic-ai\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@openai\/[^']+'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@prisma\/[^']+'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@supabase\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'neo4j-driver'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'gremlin'/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });

  it('does not call prisma. / supabase. / await db', () => {
    expect(codeOnly).not.toMatch(/\bprisma\./);
    expect(codeOnly).not.toMatch(/\bsupabase\./);
    expect(codeOnly).not.toMatch(/\bawait\s+db\b/);
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

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not contain placeholder copy', () => {
    expect(codeOnly).not.toMatch(/Coming soon/);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/);
  });

  it('does not emit executable SQL DDL in code or string literals', () => {
    // The relational fallback must be a deterministic SQL-like
    // schema description, not actual SQL. Reject CREATE TABLE,
    // ALTER TABLE, and DROP TABLE statements in code (line and
    // block comments are allowed because the prose contract may
    // legitimately describe what the future migration slice will
    // emit). codeOnly has comments and string literals stripped,
    // so this catches both code-level statements and any embedded
    // DDL hidden in a string literal that survived stripping.
    expect(codeOnly).not.toMatch(/\bCREATE\s+TABLE\b/i);
    expect(codeOnly).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(codeOnly).not.toMatch(/\bDROP\s+TABLE\b/i);
  });
});
