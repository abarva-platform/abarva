// MG4 - Tenant Model Provider Policy Matrix - integration tests.
//
// Pure deterministic coverage. No network. No live model. No DOM.
// Tests assert that:
// - All 7 provider kinds, all 4 decisions, all 5 basis values appear
//   somewhere in the canonical seed.
// - Approved decisions always carry a non-empty basis.
// - buildTenantModelPolicyMatrix is byte-equal across calls.
// - evaluateTenantModelAccess returns a typed decision for known
//   (tenant, provider, purpose) tuples, surfaces matchedEntryId, and
//   refuses empty tenantKey with a blocked decision.
// - summarizeTenantModelPolicyMatrix reconciles totals.
// - Module hygiene: no provider SDK imports (no anthropic, openai),
//   no Date.now / Math.random / new Date( / fetch(, no useState /
//   useEffect, no Coming soon / TBD / Lorem ipsum, no imports from
//   forbidden runtimes.

import {
  MODEL_PROVIDER_KINDS,
  TENANT_MODEL_POLICY_BASES,
  TENANT_MODEL_POLICY_DECISIONS,
  TENANT_MODEL_POLICY_TENANT_KEYS,
  buildTenantModelPolicyMatrix,
  evaluateTenantModelAccess,
  summarizeTenantModelPolicyMatrix,
  type ModelProviderKind,
  type TenantModelPolicyBasis,
  type TenantModelPolicyDecision,
  type TenantModelPolicyEntry,
} from '@/lib/architecture/tenant-model-provider-policy';

// ---------------------------------------------------------------------
// Canonical vocabularies
// ---------------------------------------------------------------------

describe('canonical vocabularies', () => {
  it('exposes exactly 7 provider kinds in canonical order', () => {
    expect(MODEL_PROVIDER_KINDS).toEqual([
      'provider_alpha',
      'provider_beta',
      'provider_gamma',
      'on_prem_open_weight',
      'azure_oai',
      'vertex_ai',
      'bedrock',
    ]);
    expect(MODEL_PROVIDER_KINDS).toHaveLength(7);
  });

  it('exposes exactly 4 policy decisions in canonical order', () => {
    expect(TENANT_MODEL_POLICY_DECISIONS).toEqual([
      'approved',
      'blocked',
      'deferred',
      'requires_review',
    ]);
    expect(TENANT_MODEL_POLICY_DECISIONS).toHaveLength(4);
  });

  it('exposes exactly 5 policy basis values in canonical order', () => {
    expect(TENANT_MODEL_POLICY_BASES).toEqual([
      'data_classification',
      'tenant_admin_decision',
      'security_review',
      'governance_review',
      'cost_constraint',
    ]);
    expect(TENANT_MODEL_POLICY_BASES).toHaveLength(5);
  });

  it('exposes the canonical tenant keys', () => {
    expect(TENANT_MODEL_POLICY_TENANT_KEYS).toContain('apexretail');
    expect(TENANT_MODEL_POLICY_TENANT_KEYS).toContain('meridianhealth');
  });
});

// ---------------------------------------------------------------------
// Matrix shape and coverage
// ---------------------------------------------------------------------

describe('buildTenantModelPolicyMatrix - coverage', () => {
  const matrix = buildTenantModelPolicyMatrix();

  it('returns a non-empty seed', () => {
    expect(matrix.length).toBeGreaterThan(0);
  });

  it('every entry tagged with deterministic provenance', () => {
    for (const entry of matrix) {
      expect(entry.createdFrom).toBe(
        'deterministic_tenant_model_provider_policy_seed',
      );
    }
  });

  it('every entry has a stable id matching the tmpp- prefix', () => {
    for (const entry of matrix) {
      expect(entry.id.startsWith('tmpp-')).toBe(true);
      expect(entry.id).toBe(
        'tmpp-' + entry.tenantKey + '-' + entry.provider,
      );
    }
  });

  it('covers all 7 provider kinds at least once', () => {
    const seen = new Set<ModelProviderKind>();
    for (const entry of matrix) {
      seen.add(entry.provider);
    }
    for (const provider of MODEL_PROVIDER_KINDS) {
      expect(seen.has(provider)).toBe(true);
    }
  });

  it('covers all 4 decisions at least once', () => {
    const seen = new Set<TenantModelPolicyDecision>();
    for (const entry of matrix) {
      seen.add(entry.decision);
    }
    for (const decision of TENANT_MODEL_POLICY_DECISIONS) {
      expect(seen.has(decision)).toBe(true);
    }
  });

  it('covers all 5 basis values at least once', () => {
    const seen = new Set<TenantModelPolicyBasis>();
    for (const entry of matrix) {
      for (const b of entry.basis) {
        seen.add(b);
      }
    }
    for (const basis of TENANT_MODEL_POLICY_BASES) {
      expect(seen.has(basis)).toBe(true);
    }
  });

  it('every approved entry carries a non-empty basis', () => {
    const approved = matrix.filter((e) => e.decision === 'approved');
    expect(approved.length).toBeGreaterThan(0);
    for (const entry of approved) {
      expect(entry.basis.length).toBeGreaterThan(0);
      expect(entry.nextReviewStep).toBe('');
    }
  });

  it('every non-approved entry carries a basis and a next review step', () => {
    const nonApproved = matrix.filter((e) => e.decision !== 'approved');
    expect(nonApproved.length).toBeGreaterThan(0);
    for (const entry of nonApproved) {
      expect(entry.basis.length).toBeGreaterThan(0);
      expect(entry.nextReviewStep.length).toBeGreaterThan(0);
    }
  });

  it('every entry has at least one purpose', () => {
    for (const entry of matrix) {
      expect(entry.purposes.length).toBeGreaterThan(0);
    }
  });

  it('every entry rationale is non-empty', () => {
    for (const entry of matrix) {
      expect(entry.rationale.length).toBeGreaterThan(0);
    }
  });

  it('id is unique across the matrix', () => {
    const ids = matrix.map((e: TenantModelPolicyEntry) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('determinism', () => {
  it('buildTenantModelPolicyMatrix returns byte-equal output across calls', () => {
    const a = buildTenantModelPolicyMatrix();
    const b = buildTenantModelPolicyMatrix();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('summarizeTenantModelPolicyMatrix is byte-equal across calls', () => {
    const a = summarizeTenantModelPolicyMatrix();
    const b = summarizeTenantModelPolicyMatrix();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('evaluateTenantModelAccess is byte-equal across calls for the same input', () => {
    const a = evaluateTenantModelAccess(
      'apexretail',
      'provider_alpha',
      'recommendation',
    );
    const b = evaluateTenantModelAccess(
      'apexretail',
      'provider_alpha',
      'recommendation',
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// evaluateTenantModelAccess
// ---------------------------------------------------------------------

describe('evaluateTenantModelAccess', () => {
  it('returns the matched entry decision and basis for a covered tuple', () => {
    const result = evaluateTenantModelAccess(
      'apexretail',
      'provider_alpha',
      'recommendation',
    );
    expect(result.decision).toBe('approved');
    expect(result.basis.length).toBeGreaterThan(0);
    expect(result.matchedEntryId).toBe('tmpp-apexretail-provider_alpha');
  });

  it('returns blocked for empty tenantKey', () => {
    const result = evaluateTenantModelAccess(
      '',
      'provider_alpha',
      'recommendation',
    );
    expect(result.decision).toBe('blocked');
    expect(result.matchedEntryId).toBeNull();
  });

  it('returns requires_review for unknown (tenant, provider) pair', () => {
    const result = evaluateTenantModelAccess(
      'unknown_tenant',
      'provider_alpha',
      'recommendation',
    );
    expect(result.decision).toBe('requires_review');
    expect(result.matchedEntryId).toBeNull();
  });

  it('returns requires_review when purpose is not covered by the entry', () => {
    // apexretail provider_beta covers classification / extraction /
    // audit only - asking about recommendation must downgrade.
    const result = evaluateTenantModelAccess(
      'apexretail',
      'provider_beta',
      'recommendation',
    );
    expect(result.decision).toBe('requires_review');
    expect(result.matchedEntryId).toBe('tmpp-apexretail-provider_beta');
  });

  it('surfaces a blocked decision for a tenant + provider pair the matrix blocks', () => {
    const result = evaluateTenantModelAccess(
      'meridianhealth',
      'provider_beta',
      'classification',
    );
    expect(result.decision).toBe('blocked');
    expect(result.matchedEntryId).toBe('tmpp-meridianhealth-provider_beta');
  });

  it('surfaces a deferred decision for a tenant + provider pair the matrix defers', () => {
    const result = evaluateTenantModelAccess(
      'apexretail',
      'azure_oai',
      'recommendation',
    );
    expect(result.decision).toBe('deferred');
    expect(result.matchedEntryId).toBe('tmpp-apexretail-azure_oai');
  });
});

// ---------------------------------------------------------------------
// summarizeTenantModelPolicyMatrix
// ---------------------------------------------------------------------

describe('summarizeTenantModelPolicyMatrix', () => {
  const summary = summarizeTenantModelPolicyMatrix();

  it('reports totalProviders === 7', () => {
    expect(summary.totalProviders).toBe(7);
  });

  it('reports a totalTenants count matching uniqueTenants', () => {
    expect(summary.totalTenants).toBe(summary.uniqueTenants.length);
  });

  it('uniqueTenants is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueTenants].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    expect(summary.uniqueTenants).toEqual(sorted);
    expect(new Set(summary.uniqueTenants).size).toBe(
      summary.uniqueTenants.length,
    );
  });

  it('byDecision sums to totalEntries', () => {
    const sum =
      summary.byDecision.approved +
      summary.byDecision.blocked +
      summary.byDecision.deferred +
      summary.byDecision.requires_review;
    expect(sum).toBe(summary.totalEntries);
  });

  it('byProvider sums to totalEntries', () => {
    let sum = 0;
    for (const provider of MODEL_PROVIDER_KINDS) {
      sum += summary.byProvider[provider];
    }
    expect(sum).toBe(summary.totalEntries);
  });

  it('every decision and basis bucket exists in the summary', () => {
    for (const decision of TENANT_MODEL_POLICY_DECISIONS) {
      expect(typeof summary.byDecision[decision]).toBe('number');
    }
    for (const basis of TENANT_MODEL_POLICY_BASES) {
      expect(typeof summary.byBasis[basis]).toBe('number');
    }
  });

  it('approvedCount / blockedCount / deferredCount / requiresReviewCount mirror byDecision', () => {
    expect(summary.approvedCount).toBe(summary.byDecision.approved);
    expect(summary.blockedCount).toBe(summary.byDecision.blocked);
    expect(summary.deferredCount).toBe(summary.byDecision.deferred);
    expect(summary.requiresReviewCount).toBe(
      summary.byDecision.requires_review,
    );
  });

  it('empty input returns a zero-counted summary', () => {
    const empty = summarizeTenantModelPolicyMatrix([]);
    expect(empty.totalEntries).toBe(0);
    expect(empty.totalTenants).toBe(0);
    expect(empty.approvedCount).toBe(0);
    expect(empty.blockedCount).toBe(0);
    expect(empty.deferredCount).toBe(0);
    expect(empty.requiresReviewCount).toBe(0);
    expect(empty.uniqueTenants).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene - tenant-model-provider-policy.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/tenant-model-provider-policy.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

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
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'cohere-ai'/);
  });

  it('does not reference live provider names in code', () => {
    expect(codeOnly).not.toMatch(/\banthropic\b/i);
    expect(codeOnly).not.toMatch(/\bopenai\b/i);
    expect(codeOnly).not.toMatch(/\bcohere\b/i);
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

  it('does not call fetch(', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
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
