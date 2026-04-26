// MG3 - Model Gateway Safe Integration Contract - integration tests.
//
// Pure deterministic coverage. The contract module is type-only and
// has no runtime side effects, so the tests assert:
//   - all 6 caller kinds are represented in metadata
//   - all 7 request classifications are represented in metadata
//   - all 4 model tiers are listed in modelTiersAllowed
//   - liveExecution === false
//   - cost policy carries the 3 required budget caps
//   - >= 5 audit requirements
//   - GATEWAY_FORBIDDEN_PATTERNS lists the 8 canonical strings
//   - GatewayRoutingDecision union (regex on source) covers block /
//     defer / dry_run
//   - getGatewayCallerMetadata returns metadata for known callers and
//     null for unknown / empty input
//   - summarizeGatewayIntegrationPolicy reconciles totals
//   - module hygiene: no provider SDK import statements (with
//     stripStringLiterals so the FORBIDDEN_PATTERNS array does not
//     produce false positives), no Date.now / Math.random / new Date(
//     / fetch( / useState / useEffect / Coming soon / TBD / Lorem
//     ipsum, no imports from forbidden runtimes.

import {
  GATEWAY_CALLER_KINDS,
  GATEWAY_CALLER_METADATA,
  GATEWAY_FORBIDDEN_PATTERNS,
  GATEWAY_INTEGRATION_POLICY,
  GATEWAY_MODEL_TIERS,
  GATEWAY_REQUEST_CLASSIFICATIONS,
  GATEWAY_REQUEST_CLASSIFICATION_METADATA,
  getGatewayCallerMetadata,
  getGatewayClassificationMetadata,
  summarizeGatewayIntegrationPolicy,
} from '@/lib/architecture/model-gateway-integration-contract';

// ---------------------------------------------------------------------
// Caller coverage
// ---------------------------------------------------------------------

describe('GATEWAY_CALLER_KINDS / GATEWAY_CALLER_METADATA', () => {
  it('includes all 6 canonical caller kinds', () => {
    expect(GATEWAY_CALLER_KINDS).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
      'system',
      'admin',
    ]);
    expect(GATEWAY_CALLER_KINDS).toHaveLength(6);
  });

  it('has metadata for every caller kind', () => {
    for (const caller of GATEWAY_CALLER_KINDS) {
      const meta = GATEWAY_CALLER_METADATA[caller];
      expect(meta).toBeDefined();
      expect(meta.caller).toBe(caller);
      expect(typeof meta.description).toBe('string');
      expect(meta.description.length).toBeGreaterThan(0);
      expect(Array.isArray(meta.allowedClassifications)).toBe(true);
      expect(meta.allowedClassifications.length).toBeGreaterThan(0);
      expect(GATEWAY_MODEL_TIERS).toContain(meta.defaultTier);
      expect(Array.isArray(meta.enforcementNotes)).toBe(true);
      expect(meta.enforcementNotes.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Classification coverage
// ---------------------------------------------------------------------

describe('GATEWAY_REQUEST_CLASSIFICATIONS / METADATA', () => {
  it('includes all 7 canonical classifications', () => {
    expect(GATEWAY_REQUEST_CLASSIFICATIONS).toEqual([
      'recommendation',
      'synthesis',
      'classification',
      'extraction',
      'evidence_check',
      'audit',
      'evaluation',
    ]);
    expect(GATEWAY_REQUEST_CLASSIFICATIONS).toHaveLength(7);
  });

  it('has metadata for every classification', () => {
    for (const kind of GATEWAY_REQUEST_CLASSIFICATIONS) {
      const meta = GATEWAY_REQUEST_CLASSIFICATION_METADATA[kind];
      expect(meta).toBeDefined();
      expect(meta.key).toBe(kind);
      expect(typeof meta.description).toBe('string');
      expect(meta.description.length).toBeGreaterThan(0);
      expect(GATEWAY_MODEL_TIERS).toContain(meta.defaultTier);
      expect(typeof meta.redactionRequired).toBe('boolean');
      expect(typeof meta.auditRequired).toBe('boolean');
    }
  });

  it('audit classification is itself audited', () => {
    expect(
      GATEWAY_REQUEST_CLASSIFICATION_METADATA.audit.auditRequired,
    ).toBe(true);
  });

  it('evaluation classification defaults to local-only tier', () => {
    expect(
      GATEWAY_REQUEST_CLASSIFICATION_METADATA.evaluation.defaultTier,
    ).toBe('tier_d_local_only');
  });
});

// ---------------------------------------------------------------------
// Tier coverage
// ---------------------------------------------------------------------

describe('GATEWAY_INTEGRATION_POLICY.modelTiersAllowed', () => {
  it('includes all 4 canonical tiers', () => {
    expect(GATEWAY_INTEGRATION_POLICY.modelTiersAllowed).toEqual([
      'tier_a_premium',
      'tier_b_balanced',
      'tier_c_economy',
      'tier_d_local_only',
    ]);
    expect(GATEWAY_INTEGRATION_POLICY.modelTiersAllowed).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------
// liveExecution / cost / audit / fallback
// ---------------------------------------------------------------------

describe('GATEWAY_INTEGRATION_POLICY top-level invariants', () => {
  it('liveExecution is the literal false', () => {
    expect(GATEWAY_INTEGRATION_POLICY.liveExecution).toBe(false);
  });

  it('cost policy has all 3 budget caps', () => {
    const cp = GATEWAY_INTEGRATION_POLICY.costPolicy;
    expect(typeof cp.perRequestBudgetCentsCap).toBe('number');
    expect(cp.perRequestBudgetCentsCap).toBeGreaterThan(0);
    expect(typeof cp.perTenantDailyBudgetCentsCap).toBe('number');
    expect(cp.perTenantDailyBudgetCentsCap).toBeGreaterThan(0);
    expect(typeof cp.perAgentBudgetCentsCap).toBe('number');
    expect(cp.perAgentBudgetCentsCap).toBeGreaterThan(0);
    expect(cp.costEstimateRequired).toBe(true);
    expect(cp.costAuditRequired).toBe(true);
  });

  it('has at least 5 audit requirements', () => {
    expect(
      GATEWAY_INTEGRATION_POLICY.auditRequirements.length,
    ).toBeGreaterThanOrEqual(5);
  });

  it('audit requirements cover the canonical keys', () => {
    const keys = GATEWAY_INTEGRATION_POLICY.auditRequirements.map(
      (r) => r.requirementKey,
    );
    expect(keys).toContain('every_request_audited');
    expect(keys).toContain('evidence_check_requires_evidence_basis');
    expect(keys).toContain('recommendation_requires_rationale');
    expect(keys).toContain('write_classifications_require_approval');
    expect(keys).toContain('model_selection_traced');
  });

  it('fallback policy lists the standard tier_a -> tier_b -> tier_c -> tier_d chain', () => {
    expect(
      GATEWAY_INTEGRATION_POLICY.fallbackPolicy.enableFallback,
    ).toBe(true);
    expect(
      GATEWAY_INTEGRATION_POLICY.fallbackPolicy.fallbackChainTiers,
    ).toEqual([
      'tier_a_premium',
      'tier_b_balanced',
      'tier_c_economy',
      'tier_d_local_only',
    ]);
    expect(
      GATEWAY_INTEGRATION_POLICY.fallbackPolicy
        .blockedReasonsThatTriggerFallback.length,
    ).toBeGreaterThan(0);
  });

  it('callersForbidden names anti-pattern integration shapes', () => {
    const forbidden = GATEWAY_INTEGRATION_POLICY.callersForbidden;
    expect(forbidden).toContain('page_component');
    expect(forbidden).toContain('agent_direct_provider_call');
  });

  it('redactionPoliciesRequired covers the 4 canonical redaction policies', () => {
    expect(GATEWAY_INTEGRATION_POLICY.redactionPoliciesRequired).toEqual([
      'redact_pii',
      'redact_secrets',
      'redact_evidence_metadata',
      'redact_tenant_isolation',
    ]);
  });
});

// ---------------------------------------------------------------------
// Forbidden-pattern constant
// ---------------------------------------------------------------------

describe('GATEWAY_FORBIDDEN_PATTERNS', () => {
  it('includes the 8 canonical anti-pattern strings', () => {
    expect(GATEWAY_FORBIDDEN_PATTERNS).toEqual([
      'agent_direct_provider_call',
      'page_direct_provider_call',
      'unaudited_model_call',
      'sdk_import_outside_gateway',
      'fetch_to_provider_endpoint',
      'env_secret_exposed_to_browser',
      'unredacted_pii_to_provider',
      'cross_tenant_request',
    ]);
    expect(GATEWAY_FORBIDDEN_PATTERNS).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------
// Routing-decision union (regex on source)
// ---------------------------------------------------------------------

describe('GatewayRoutingDecision union', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/model-gateway-integration-contract.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('covers block / defer / dry_run states in the union', () => {
    expect(source).toMatch(/'block'/);
    expect(source).toMatch(/'defer'/);
    expect(source).toMatch(/'dry_run'/);
    expect(source).toMatch(/'allow'/);
    expect(source).toMatch(/'route_to_fallback'/);
  });
});

// ---------------------------------------------------------------------
// Pure accessors
// ---------------------------------------------------------------------

describe('getGatewayCallerMetadata', () => {
  it('returns metadata for a known caller', () => {
    const meta = getGatewayCallerMetadata('nexus');
    expect(meta).not.toBeNull();
    expect(meta?.caller).toBe('nexus');
    expect(meta?.allowedClassifications.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown caller', () => {
    expect(getGatewayCallerMetadata('rogue_agent')).toBeNull();
  });

  it('returns null for the empty string', () => {
    expect(getGatewayCallerMetadata('')).toBeNull();
  });
});

describe('getGatewayClassificationMetadata', () => {
  it('returns metadata for a known classification', () => {
    const meta = getGatewayClassificationMetadata('recommendation');
    expect(meta).not.toBeNull();
    expect(meta?.key).toBe('recommendation');
  });

  it('returns null for an unknown classification', () => {
    expect(getGatewayClassificationMetadata('unknown_kind')).toBeNull();
  });

  it('returns null for the empty string', () => {
    expect(getGatewayClassificationMetadata('')).toBeNull();
  });
});

describe('summarizeGatewayIntegrationPolicy', () => {
  it('reconciles totals with the canonical lists', () => {
    const summary = summarizeGatewayIntegrationPolicy();
    expect(summary.totalCallers).toBe(GATEWAY_CALLER_KINDS.length);
    expect(summary.totalClassifications).toBe(
      GATEWAY_REQUEST_CLASSIFICATIONS.length,
    );
    expect(summary.totalTiers).toBe(GATEWAY_MODEL_TIERS.length);
    expect(summary.auditRequirementsCount).toBe(
      GATEWAY_INTEGRATION_POLICY.auditRequirements.length,
    );
    expect(summary.forbiddenPatternsCount).toBe(
      GATEWAY_FORBIDDEN_PATTERNS.length,
    );
    expect(summary.totalCallers).toBe(6);
    expect(summary.totalClassifications).toBe(7);
    expect(summary.totalTiers).toBe(4);
    expect(summary.forbiddenPatternsCount).toBe(8);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene - model-gateway-integration-contract.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/model-gateway-integration-contract.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Strip block comments, line comments, and string literals so
  // hygiene assertions fire on real code only. The
  // GATEWAY_FORBIDDEN_PATTERNS list legitimately contains strings
  // like 'sdk_import_outside_gateway' and
  // 'fetch_to_provider_endpoint'; we must scan code, not data.
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
