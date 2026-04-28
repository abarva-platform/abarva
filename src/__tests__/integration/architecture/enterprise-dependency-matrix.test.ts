// CLOUD6 - Enterprise Dependency Matrix tests.
//
// Deterministic, file-pure suite. No network calls, no model
// providers, no migrations, no time-of-day dependence, no auth import.

import {
  DEPENDENCY_CAPABILITIES,
  DEPENDENCY_READINESS_STATES,
  DEPLOYMENT_TARGETS,
  buildEnterpriseDependencyMatrix,
  getNotSupportedCombinations,
  listDependencyCapabilities,
  listDependencyReadinessStates,
  listDeploymentTargets,
  summarizeEnterpriseDependencyMatrix,
  type DependencyCapability,
  type DependencyMatrixEntry,
  type DependencyReadiness,
  type DeploymentTarget,
  type EnterpriseDependencyMatrix,
} from '@/lib/architecture/enterprise-dependency-matrix';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildEnterpriseDependencyMatrix · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildEnterpriseDependencyMatrix());
    const second = JSON.stringify(buildEnterpriseDependencyMatrix());
    const third = JSON.stringify(buildEnterpriseDependencyMatrix());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('summarizeEnterpriseDependencyMatrix is byte-equal across repeated calls', () => {
    const a = JSON.stringify(
      summarizeEnterpriseDependencyMatrix(buildEnterpriseDependencyMatrix()),
    );
    const b = JSON.stringify(
      summarizeEnterpriseDependencyMatrix(buildEnterpriseDependencyMatrix()),
    );
    expect(b).toBe(a);
  });

  it('getNotSupportedCombinations is byte-equal across repeated calls', () => {
    const a = JSON.stringify(
      getNotSupportedCombinations(buildEnterpriseDependencyMatrix()),
    );
    const b = JSON.stringify(
      getNotSupportedCombinations(buildEnterpriseDependencyMatrix()),
    );
    expect(b).toBe(a);
  });
});

// ---------------------------------------------------------------------
// Canonical vocabularies
// ---------------------------------------------------------------------

describe('canonical vocabularies', () => {
  it('all 5 deployment targets are present and ordered', () => {
    expect(DEPLOYMENT_TARGETS).toEqual([
      'vercel_saas',
      'azure_vnet',
      'gcp_vpc',
      'aws_private',
      'on_prem_air_gapped',
    ]);
    expect(DEPLOYMENT_TARGETS.length).toBe(5);
    expect(listDeploymentTargets()).toEqual(DEPLOYMENT_TARGETS);
  });

  it('all 11 capabilities are present and ordered', () => {
    expect(DEPENDENCY_CAPABILITIES).toEqual([
      'frontend_hosting',
      'compute',
      'postgres',
      'blob',
      'secrets',
      'idp',
      'observability',
      'vector_search',
      'graph',
      'model_gateway',
      'ci_cd',
    ]);
    expect(DEPENDENCY_CAPABILITIES.length).toBe(11);
    expect(listDependencyCapabilities()).toEqual(DEPENDENCY_CAPABILITIES);
  });

  it('all 4 readiness states are representable and ordered', () => {
    expect(DEPENDENCY_READINESS_STATES).toEqual([
      'available',
      'preview',
      'deferred',
      'not_supported',
    ]);
    expect(DEPENDENCY_READINESS_STATES.length).toBe(4);
    expect(listDependencyReadinessStates()).toEqual(
      DEPENDENCY_READINESS_STATES,
    );
  });
});

// ---------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------

describe('matrix · coverage', () => {
  const matrix = buildEnterpriseDependencyMatrix();

  it('contains exactly capabilities × targets entries', () => {
    expect(matrix.entries.length).toBe(
      DEPENDENCY_CAPABILITIES.length * DEPLOYMENT_TARGETS.length,
    );
  });

  it('every capability × target pair appears exactly once', () => {
    const seen = new Set<string>();
    for (const entry of matrix.entries) {
      const key = `${entry.capability}::${entry.target}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(
      DEPENDENCY_CAPABILITIES.length * DEPLOYMENT_TARGETS.length,
    );
    for (const capability of DEPENDENCY_CAPABILITIES) {
      for (const target of DEPLOYMENT_TARGETS) {
        expect(seen.has(`${capability}::${target}`)).toBe(true);
      }
    }
  });

  it('every entry id is unique and stable', () => {
    const ids = matrix.entries.map((entry) => entry.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
    for (const entry of matrix.entries) {
      expect(entry.id).toBe(`matrix-${entry.capability}-${entry.target}`);
    }
  });

  it('every entry has non-empty defaultOption / fallbackOption / notes / followUp', () => {
    for (const entry of matrix.entries) {
      expect(entry.defaultOption.length).toBeGreaterThan(0);
      expect(entry.fallbackOption.length).toBeGreaterThan(0);
      expect(entry.notes.length).toBeGreaterThan(0);
      expect(entry.followUp.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('every entry uses a known readiness value', () => {
    for (const entry of matrix.entries) {
      expect(DEPENDENCY_READINESS_STATES).toContain(entry.readiness);
    }
  });

  it('every readiness state is representable somewhere in the seed', () => {
    const seenReadiness = new Set<DependencyReadiness>(
      matrix.entries.map((entry) => entry.readiness),
    );
    for (const state of DEPENDENCY_READINESS_STATES) {
      expect(seenReadiness.has(state)).toBe(true);
    }
  });

  it('every entry carries the deterministic createdFrom tag', () => {
    expect(matrix.createdFrom).toBe(
      'deterministic_enterprise_dependency_matrix_seed',
    );
    for (const entry of matrix.entries) {
      expect(entry.createdFrom).toBe(
        'deterministic_enterprise_dependency_matrix_seed',
      );
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeEnterpriseDependencyMatrix', () => {
  const matrix = buildEnterpriseDependencyMatrix();
  const summary = summarizeEnterpriseDependencyMatrix(matrix);

  it('totalEntries equals capabilities × targets', () => {
    expect(summary.totalEntries).toBe(
      DEPENDENCY_CAPABILITIES.length * DEPLOYMENT_TARGETS.length,
    );
  });

  it('entriesByTarget reconciles to totalEntries', () => {
    const sum = (Object.values(summary.entriesByTarget) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(summary.totalEntries);
    for (const target of DEPLOYMENT_TARGETS) {
      expect(summary.entriesByTarget[target]).toBe(
        DEPENDENCY_CAPABILITIES.length,
      );
    }
  });

  it('entriesByCapability reconciles to totalEntries', () => {
    const sum = (
      Object.values(summary.entriesByCapability) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
    for (const capability of DEPENDENCY_CAPABILITIES) {
      expect(summary.entriesByCapability[capability]).toBe(
        DEPLOYMENT_TARGETS.length,
      );
    }
  });

  it('entriesByReadiness reconciles to totalEntries', () => {
    const sum = (
      Object.values(summary.entriesByReadiness) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('capabilitiesCovered matches the canonical capability vocabulary', () => {
    expect(new Set(summary.capabilitiesCovered)).toEqual(
      new Set(DEPENDENCY_CAPABILITIES),
    );
  });

  it('targetsCovered matches the canonical deployment target vocabulary', () => {
    expect(new Set(summary.targetsCovered)).toEqual(new Set(DEPLOYMENT_TARGETS));
  });

  it('notSupportedCount equals the number of not_supported entries', () => {
    const expectedCount = matrix.entries.filter(
      (entry) => entry.readiness === 'not_supported',
    ).length;
    expect(summary.notSupportedCount).toBe(expectedCount);
  });

  it('defaults to summarizing the canonical seed when called with no arguments', () => {
    const explicit = summarizeEnterpriseDependencyMatrix(matrix);
    const implicit = summarizeEnterpriseDependencyMatrix();
    expect(JSON.stringify(implicit)).toBe(JSON.stringify(explicit));
  });
});

// ---------------------------------------------------------------------
// getNotSupportedCombinations
// ---------------------------------------------------------------------

describe('getNotSupportedCombinations', () => {
  const matrix = buildEnterpriseDependencyMatrix();

  it('returns only entries with not_supported readiness', () => {
    const result = getNotSupportedCombinations(matrix);
    for (const entry of result) {
      expect(entry.readiness).toBe('not_supported');
    }
  });

  it('reconciles with the summary count', () => {
    const result = getNotSupportedCombinations(matrix);
    const summary = summarizeEnterpriseDependencyMatrix(matrix);
    expect(result.length).toBe(summary.notSupportedCount);
  });

  it('defaults to the canonical seed when called with no arguments', () => {
    const explicit = JSON.stringify(getNotSupportedCombinations(matrix));
    const implicit = JSON.stringify(getNotSupportedCombinations());
    expect(implicit).toBe(explicit);
  });

  it('correctly excludes entries with other readiness states from a synthetic matrix', () => {
    const seed = buildEnterpriseDependencyMatrix();
    const synthetic: EnterpriseDependencyMatrix = {
      ...seed,
      entries: seed.entries.map<DependencyMatrixEntry>((entry, index) =>
        index === 0 ? { ...entry, readiness: 'available' } : entry,
      ),
    };
    const result = getNotSupportedCombinations(synthetic);
    for (const entry of result) {
      expect(entry.readiness).toBe('not_supported');
    }
  });
});

// ---------------------------------------------------------------------
// Type contract sanity checks
// ---------------------------------------------------------------------

describe('type contract sanity', () => {
  it('a DeploymentTarget literal is assignable from each canonical value', () => {
    const targets: readonly DeploymentTarget[] = [
      'vercel_saas',
      'azure_vnet',
      'gcp_vpc',
      'aws_private',
      'on_prem_air_gapped',
    ];
    expect(targets.length).toBe(DEPLOYMENT_TARGETS.length);
  });

  it('a DependencyCapability literal is assignable from each canonical value', () => {
    const capabilities: readonly DependencyCapability[] = [
      'frontend_hosting',
      'compute',
      'postgres',
      'blob',
      'secrets',
      'idp',
      'observability',
      'vector_search',
      'graph',
      'model_gateway',
      'ci_cd',
    ];
    expect(capabilities.length).toBe(DEPENDENCY_CAPABILITIES.length);
  });

  it('a DependencyReadiness literal is assignable from each canonical value', () => {
    const states: readonly DependencyReadiness[] = [
      'available',
      'preview',
      'deferred',
      'not_supported',
    ];
    expect(states.length).toBe(DEPENDENCY_READINESS_STATES.length);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · enterprise-dependency-matrix.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/enterprise-dependency-matrix.ts',
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

  it('does not import migrations or supabase client', () => {
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

  it('does not invoke Anthropic / OpenAI / Cohere / Databricks / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/cohere/i);
    expect(codeOnly).not.toMatch(/databricks/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
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

  it('does not invent dollar amounts in serialized output', () => {
    const serialized = JSON.stringify(buildEnterpriseDependencyMatrix());
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not claim production-ready in serialized output', () => {
    const serialized = JSON.stringify(
      buildEnterpriseDependencyMatrix(),
    ).toLowerCase();
    expect(serialized).not.toMatch(/production_ready/);
    expect(serialized).not.toMatch(/production-ready/);
    expect(serialized).not.toMatch(/fully enforced in production/);
  });

  it('does not invent live runtime claims for vendor models in serialized output', () => {
    const serialized = JSON.stringify(buildEnterpriseDependencyMatrix());
    expect(serialized).not.toMatch(/anthropic/i);
    expect(serialized).not.toMatch(/openai/i);
    expect(serialized).not.toMatch(/cohere/i);
    expect(serialized).not.toMatch(/databricks/i);
    expect(serialized).not.toMatch(/pinecone/i);
  });
});
