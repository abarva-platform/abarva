// DATA6 - Provider-Agnostic Vector / Search Contract - integration tests.
//
// Pure deterministic coverage. The contract module is data-only and
// has no runtime side effects, so the tests assert:
//   - all 4 provider kinds are represented as profiles
//   - all 6 canonical capabilities are representable on at least one profile
//   - all 3 tenant isolation models appear in the canonical vocabulary
//   - listVectorSearchProviders() / buildVectorSearchProviderRegistry()
//     / summarizeVectorSearchProviders() are byte-equal deterministic
//     across two consecutive invocations
//   - the registry adapter contracts carry the canonical createdFrom
//     seed and liveBinding === false
//   - module hygiene on the source: no provider SDK import statements
//     (with stripStringLiterals so the env-var / capability strings do
//     not produce false positives), no Date.now / Math.random / new
//     Date( / fetch( / http( / axios runtime calls, no live URL or
//     forbidden runtime imports, no React hooks or placeholder copy.

import {
  VECTOR_SEARCH_CAPABILITIES,
  VECTOR_SEARCH_PROVIDER_KINDS,
  VECTOR_SEARCH_TENANT_ISOLATION_MODELS,
  buildVectorSearchProviderRegistry,
  getVectorSearchProviderProfile,
  listVectorSearchProviders,
  summarizeVectorSearchProviders,
  type VectorSearchCapability,
  type VectorSearchProviderKind,
} from '@/lib/architecture/vector-search-provider-contract';

// ---------------------------------------------------------------------
// Provider-kind coverage
// ---------------------------------------------------------------------

describe('VECTOR_SEARCH_PROVIDER_KINDS', () => {
  it('includes all 4 canonical provider kinds in canonical order', () => {
    expect(VECTOR_SEARCH_PROVIDER_KINDS).toEqual([
      'pgvector',
      'azure_ai_search',
      'alloydb_cloud_sql_vector',
      'pinecone_like_generic',
    ]);
    expect(VECTOR_SEARCH_PROVIDER_KINDS).toHaveLength(4);
  });

  it('listVectorSearchProviders returns one profile per kind', () => {
    const profiles = listVectorSearchProviders();
    expect(profiles).toHaveLength(VECTOR_SEARCH_PROVIDER_KINDS.length);
    for (let i = 0; i < VECTOR_SEARCH_PROVIDER_KINDS.length; i += 1) {
      expect(profiles[i].kind).toBe(VECTOR_SEARCH_PROVIDER_KINDS[i]);
    }
  });

  it('every profile carries description / capabilities / tenant isolation / audit hooks / env vars / liveExecution=false', () => {
    for (const profile of listVectorSearchProviders()) {
      expect(VECTOR_SEARCH_PROVIDER_KINDS).toContain(profile.kind);
      expect(typeof profile.description).toBe('string');
      expect(profile.description.length).toBeGreaterThan(0);
      expect(Array.isArray(profile.capabilities)).toBe(true);
      expect(profile.capabilities.length).toBeGreaterThan(0);
      for (const capability of profile.capabilities) {
        expect(VECTOR_SEARCH_CAPABILITIES).toContain(capability);
      }
      expect(VECTOR_SEARCH_TENANT_ISOLATION_MODELS).toContain(
        profile.tenantIsolationModel,
      );
      expect(Array.isArray(profile.auditHooks)).toBe(true);
      expect(profile.auditHooks.length).toBeGreaterThan(0);
      expect(Array.isArray(profile.requiredEnvVars)).toBe(true);
      expect(profile.requiredEnvVars.length).toBeGreaterThan(0);
      expect(profile.liveExecution).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------
// Capability coverage
// ---------------------------------------------------------------------

describe('VECTOR_SEARCH_CAPABILITIES', () => {
  it('includes all 6 canonical capabilities', () => {
    expect(VECTOR_SEARCH_CAPABILITIES).toEqual([
      'similarity_search',
      'hybrid_search',
      'metadata_filter',
      'reranking',
      'tenant_isolation',
      'index_management',
    ]);
    expect(VECTOR_SEARCH_CAPABILITIES).toHaveLength(6);
  });

  it('every capability is representable on at least one provider profile', () => {
    const seen = new Set<VectorSearchCapability>();
    for (const profile of listVectorSearchProviders()) {
      for (const cap of profile.capabilities) {
        seen.add(cap);
      }
    }
    for (const cap of VECTOR_SEARCH_CAPABILITIES) {
      expect(seen.has(cap)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Tenant isolation coverage
// ---------------------------------------------------------------------

describe('VECTOR_SEARCH_TENANT_ISOLATION_MODELS', () => {
  it('includes the 3 canonical isolation models', () => {
    expect(VECTOR_SEARCH_TENANT_ISOLATION_MODELS).toEqual([
      'logical_namespace',
      'physical_separation',
      'index_per_tenant',
    ]);
    expect(VECTOR_SEARCH_TENANT_ISOLATION_MODELS).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------
// Adapter registry shape
// ---------------------------------------------------------------------

describe('buildVectorSearchProviderRegistry', () => {
  it('returns one adapter contract per provider kind', () => {
    const registry = buildVectorSearchProviderRegistry();
    expect(registry).toHaveLength(VECTOR_SEARCH_PROVIDER_KINDS.length);
    for (let i = 0; i < VECTOR_SEARCH_PROVIDER_KINDS.length; i += 1) {
      expect(registry[i].profile.kind).toBe(
        VECTOR_SEARCH_PROVIDER_KINDS[i],
      );
    }
  });

  it('every adapter contract carries createdFrom seed and liveBinding=false', () => {
    for (const adapter of buildVectorSearchProviderRegistry()) {
      expect(adapter.createdFrom).toBe(
        'deterministic_vector_search_provider_seed',
      );
      expect(adapter.liveBinding).toBe(false);
      expect(typeof adapter.adapterKey).toBe('string');
      expect(adapter.adapterKey.length).toBeGreaterThan(0);
      expect(adapter.adapterKey).toMatch(/^vector_search\.adapter\./);
    }
  });
});

// ---------------------------------------------------------------------
// Pure accessor
// ---------------------------------------------------------------------

describe('getVectorSearchProviderProfile', () => {
  it('returns the canonical profile for a known kind', () => {
    const profile = getVectorSearchProviderProfile('pgvector');
    expect(profile).not.toBeNull();
    expect(profile?.kind).toBe('pgvector');
  });

  it('returns null for an unknown kind', () => {
    expect(getVectorSearchProviderProfile('rogue_provider')).toBeNull();
  });

  it('returns null for the empty string', () => {
    expect(getVectorSearchProviderProfile('')).toBeNull();
  });
});

// ---------------------------------------------------------------------
// Determinism (byte-equal across consecutive invocations)
// ---------------------------------------------------------------------

describe('byte-equal determinism', () => {
  it('listVectorSearchProviders is byte-equal across calls', () => {
    const a = JSON.stringify(listVectorSearchProviders());
    const b = JSON.stringify(listVectorSearchProviders());
    expect(a).toBe(b);
  });

  it('buildVectorSearchProviderRegistry is byte-equal across calls', () => {
    const a = JSON.stringify(buildVectorSearchProviderRegistry());
    const b = JSON.stringify(buildVectorSearchProviderRegistry());
    expect(a).toBe(b);
  });

  it('summarizeVectorSearchProviders is byte-equal across calls', () => {
    const a = JSON.stringify(summarizeVectorSearchProviders());
    const b = JSON.stringify(summarizeVectorSearchProviders());
    expect(a).toBe(b);
  });

  it('summary reconciles with the canonical lists', () => {
    const summary = summarizeVectorSearchProviders();
    expect(summary.totalProviders).toBe(VECTOR_SEARCH_PROVIDER_KINDS.length);
    expect(summary.totalCapabilities).toBe(
      VECTOR_SEARCH_CAPABILITIES.length,
    );
    expect(summary.totalTenantIsolationModels).toBe(
      VECTOR_SEARCH_TENANT_ISOLATION_MODELS.length,
    );
    expect(summary.totalProviders).toBe(4);
    expect(summary.totalCapabilities).toBe(6);
    expect(summary.totalTenantIsolationModels).toBe(3);
    for (const kind of VECTOR_SEARCH_PROVIDER_KINDS) {
      const caps = summary.capabilitiesByProvider[kind];
      expect(Array.isArray(caps)).toBe(true);
      expect(caps.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene (no live calls, no forbidden runtime imports)
// ---------------------------------------------------------------------

describe('module hygiene - vector-search-provider-contract.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/vector-search-provider-contract.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Strip block comments, line comments, and string literals so
  // hygiene assertions fire on real code only. The provider env-var
  // and audit-hook arrays legitimately contain strings like
  // 'AZURE_AI_SEARCH_ENDPOINT' and 'vector_search_request_started';
  // we must scan code, not data.
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
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@pinecone-database\/[^']+'/,
    );
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@azure\/search-documents'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'pg'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@google-cloud\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'openai'/);
    expect(source).not.toMatch(
      /import\s+[^;]*\s+from\s+'@anthropic-ai\/[^']+'/,
    );
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'axios'/);
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

  it('does not call fetch( / http( / axios runtime in code', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/\bhttp\(/);
    expect(codeOnly).not.toMatch(/\baxios\b/);
  });

  it('does not reference live SDK names in code', () => {
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
});

// ---------------------------------------------------------------------
// Type-level smoke (compile-time only; ensures the unions exist)
// ---------------------------------------------------------------------

describe('exported type unions', () => {
  it('every VectorSearchProviderKind value is representable', () => {
    const kinds: VectorSearchProviderKind[] = [
      'pgvector',
      'azure_ai_search',
      'alloydb_cloud_sql_vector',
      'pinecone_like_generic',
    ];
    expect(kinds).toHaveLength(4);
  });

  it('every VectorSearchCapability value is representable', () => {
    const caps: VectorSearchCapability[] = [
      'similarity_search',
      'hybrid_search',
      'metadata_filter',
      'reranking',
      'tenant_isolation',
      'index_management',
    ];
    expect(caps).toHaveLength(6);
  });
});
