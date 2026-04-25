// SOL6 · Build / Buy / Partner Decision Framework tests.

import {
  BUILD_BUY_PARTNER_CRITERIA,
  evaluateBuildBuyPartnerScenario,
  listBuildBuyPartnerCriteria,
  listEnterpriseReadinessRisks,
  listVendorStartupAssessmentFactors,
  summarizeBuildBuyPartnerRecommendation,
  type BuildBuyPartnerCriterion,
  type BuildBuyPartnerOption,
  type BuildBuyPartnerScenarioInput,
} from '@/lib/solutions/build-buy-partner-framework';

const DOLLAR_PATTERN = /\$\s?\d/;

const BASE_INPUT: BuildBuyPartnerScenarioInput = {
  differentiation: 'medium',
  internalCapabilityPresent: false,
  timeToValuePressure: 'medium',
  marketCapabilityMaturity: 'emerging',
  regulatedContext: false,
  highRiskTags: [],
  dataRightsRequired: 'shared',
  workflowComplexity: 'medium',
};

function inputWith(
  overrides: Partial<BuildBuyPartnerScenarioInput>,
): BuildBuyPartnerScenarioInput {
  return { ...BASE_INPUT, ...overrides };
}

// ---------------------------------------------------------------------
// 14 criteria in canonical order
// ---------------------------------------------------------------------

describe('listBuildBuyPartnerCriteria', () => {
  it('returns exactly 14 criteria in canonical order', () => {
    const criteria = listBuildBuyPartnerCriteria();
    expect(criteria.length).toBe(14);
    const expected: BuildBuyPartnerCriterion[] = [
      'time_to_value',
      'strategic_differentiation',
      'data_rights_ip',
      'integration_complexity',
      'regulatory_risk',
      'enterprise_readiness',
      'total_cost_of_ownership',
      'vendor_lock_in',
      'model_governance',
      'talent_capacity',
      'workflow_fit',
      'scalability',
      'ecosystem_maturity',
      'change_management_burden',
    ];
    expect(criteria.map((c) => c.key)).toEqual(expected);
    expect(BUILD_BUY_PARTNER_CRITERIA).toEqual(expected);
  });

  it('every criterion carries the required field set', () => {
    for (const c of listBuildBuyPartnerCriteria()) {
      expect(typeof c.key).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.buildSignal.length).toBeGreaterThan(0);
      expect(c.buySignal.length).toBeGreaterThan(0);
      expect(c.partnerSignal.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(c.weight);
    }
  });

  it('returns deterministic, byte-equal output across repeated calls', () => {
    const a = listBuildBuyPartnerCriteria();
    const b = listBuildBuyPartnerCriteria();
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// >=8 vendor / startup factors covering all 5 categories
// ---------------------------------------------------------------------

describe('listVendorStartupAssessmentFactors', () => {
  it('returns at least 8 factors', () => {
    const factors = listVendorStartupAssessmentFactors();
    expect(factors.length).toBeGreaterThanOrEqual(8);
  });

  it('covers all five categories', () => {
    const categories = new Set(
      listVendorStartupAssessmentFactors().map((f) => f.category),
    );
    expect(categories.has('capability')).toBe(true);
    expect(categories.has('commercial')).toBe(true);
    expect(categories.has('governance')).toBe(true);
    expect(categories.has('integration')).toBe(true);
    expect(categories.has('enterprise_readiness')).toBe(true);
  });

  it('every factor carries non-empty red-flag and green-flag signals', () => {
    for (const f of listVendorStartupAssessmentFactors()) {
      expect(f.key.length).toBeGreaterThan(0);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(f.redFlagSignals.length).toBeGreaterThan(0);
      expect(f.greenFlagSignals.length).toBeGreaterThan(0);
    }
  });

  it('returns deterministic, byte-equal output across repeated calls', () => {
    const a = listVendorStartupAssessmentFactors();
    const b = listVendorStartupAssessmentFactors();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// >=5 enterprise readiness risks
// ---------------------------------------------------------------------

describe('listEnterpriseReadinessRisks', () => {
  it('returns at least 5 risks', () => {
    const risks = listEnterpriseReadinessRisks();
    expect(risks.length).toBeGreaterThanOrEqual(5);
  });

  it('every risk carries name, description, mitigations, severity', () => {
    for (const r of listEnterpriseReadinessRisks()) {
      expect(r.key.length).toBeGreaterThan(0);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(0);
      expect(r.mitigations.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(r.severity);
    }
  });

  it('returns deterministic, byte-equal output across repeated calls', () => {
    const a = listEnterpriseReadinessRisks();
    const b = listEnterpriseReadinessRisks();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Deterministic recommendations
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · determinism', () => {
  it('byte-equal across calls for the same input', () => {
    const input = inputWith({});
    const a = evaluateBuildBuyPartnerScenario(input);
    const b = evaluateBuildBuyPartnerScenario(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('every result is tagged createdFrom: deterministic_build_buy_partner_framework', () => {
    const result = evaluateBuildBuyPartnerScenario(inputWith({}));
    expect(result.createdFrom).toBe('deterministic_build_buy_partner_framework');
  });

  it('result.input echoes the supplied input', () => {
    const input = inputWith({ capabilityKey: 'analytics_assistant' });
    const result = evaluateBuildBuyPartnerScenario(input);
    expect(result.input).toEqual(input);
  });

  it('every signal references a canonical criterion key', () => {
    const result = evaluateBuildBuyPartnerScenario(inputWith({}));
    const allowed = new Set<string>(BUILD_BUY_PARTNER_CRITERIA);
    expect(result.recommendation.signals.length).toBe(BUILD_BUY_PARTNER_CRITERIA.length);
    for (const s of result.recommendation.signals) {
      expect(allowed.has(s.criterion)).toBe(true);
      expect(['build', 'buy', 'partner']).toContain(s.favors);
      expect(s.rationale.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Build rule
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · build rule', () => {
  it('recommends build when differentiation=high AND internalCapabilityPresent=true', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'high',
        internalCapabilityPresent: true,
        timeToValuePressure: 'low',
        marketCapabilityMaturity: 'emerging',
        dataRightsRequired: 'tenant_owned',
        workflowComplexity: 'high',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('build');
  });

  it('omits vendor / startup checks when option is build', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'high',
        internalCapabilityPresent: true,
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('build');
    expect(result.recommendation.vendorStartupChecks).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Buy rule
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · buy rule', () => {
  it('recommends buy when timeToValue=high AND market=mature AND diff!=high', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'low',
        timeToValuePressure: 'high',
        marketCapabilityMaturity: 'mature',
        dataRightsRequired: 'vendor_owned_acceptable',
        workflowComplexity: 'low',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('buy');
  });

  it('vendor / startup checks are populated when option is buy', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'low',
        timeToValuePressure: 'high',
        marketCapabilityMaturity: 'mature',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('buy');
    expect(result.recommendation.vendorStartupChecks.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Partner rule
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · partner rule', () => {
  it('recommends partner when market=fragmented AND diff!=low', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'medium',
        marketCapabilityMaturity: 'fragmented',
        timeToValuePressure: 'medium',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('partner');
  });

  it('falls back to partner when no top-level rule fires', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'low',
        internalCapabilityPresent: false,
        timeToValuePressure: 'low',
        marketCapabilityMaturity: 'emerging',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('partner');
  });

  it('vendor / startup checks are populated when option is partner', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({
        differentiation: 'medium',
        marketCapabilityMaturity: 'fragmented',
      }),
    );
    expect(result.recommendation.recommendedOption).toBe('partner');
    expect(result.recommendation.vendorStartupChecks.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Governance warnings
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · governance warnings', () => {
  it('populates warnings when regulatedContext is true', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({ regulatedContext: true }),
    );
    expect(result.recommendation.governanceWarnings.length).toBeGreaterThan(0);
  });

  it('populates warnings when highRiskTags is non-empty', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({ regulatedContext: false, highRiskTags: ['phi'] }),
    );
    expect(result.recommendation.governanceWarnings.length).toBeGreaterThan(0);
  });

  it('emits no governance warnings when context is unregulated and tags are empty and rights are shared', () => {
    const result = evaluateBuildBuyPartnerScenario(
      inputWith({ regulatedContext: false, highRiskTags: [], dataRightsRequired: 'shared' }),
    );
    expect(result.recommendation.governanceWarnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Confidence enum
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · confidence', () => {
  it('confidence is always one of low | medium | high', () => {
    const inputs: BuildBuyPartnerScenarioInput[] = [
      inputWith({}),
      inputWith({ differentiation: 'high', internalCapabilityPresent: true }),
      inputWith({
        timeToValuePressure: 'high',
        marketCapabilityMaturity: 'mature',
        differentiation: 'low',
      }),
      inputWith({ marketCapabilityMaturity: 'fragmented', differentiation: 'medium' }),
      inputWith({ marketCapabilityMaturity: 'emerging' }),
    ];
    for (const i of inputs) {
      const r = evaluateBuildBuyPartnerScenario(i);
      expect(['low', 'medium', 'high']).toContain(r.recommendation.confidence);
    }
  });

  it('option enum is always build | buy | partner', () => {
    const r = evaluateBuildBuyPartnerScenario(inputWith({}));
    const options: BuildBuyPartnerOption[] = ['build', 'buy', 'partner'];
    expect(options).toContain(r.recommendation.recommendedOption);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeBuildBuyPartnerRecommendation', () => {
  it('returns a non-empty string mentioning the recommended option and confidence', () => {
    const r = evaluateBuildBuyPartnerScenario(
      inputWith({ differentiation: 'high', internalCapabilityPresent: true }),
    );
    const s = summarizeBuildBuyPartnerRecommendation(r);
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
    expect(s).toContain('build');
    expect(s).toMatch(/confidence (low|medium|high)/);
  });

  it('is deterministic for the same input', () => {
    const r1 = evaluateBuildBuyPartnerScenario(inputWith({}));
    const r2 = evaluateBuildBuyPartnerScenario(inputWith({}));
    expect(summarizeBuildBuyPartnerRecommendation(r1)).toBe(
      summarizeBuildBuyPartnerRecommendation(r2),
    );
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no criterion string field invents a dollar amount', () => {
    for (const c of listBuildBuyPartnerCriteria()) {
      expect(c.name).not.toMatch(DOLLAR_PATTERN);
      expect(c.description).not.toMatch(DOLLAR_PATTERN);
      expect(c.buildSignal).not.toMatch(DOLLAR_PATTERN);
      expect(c.buySignal).not.toMatch(DOLLAR_PATTERN);
      expect(c.partnerSignal).not.toMatch(DOLLAR_PATTERN);
    }
  });

  it('no vendor / startup factor string field invents a dollar amount', () => {
    for (const f of listVendorStartupAssessmentFactors()) {
      expect(f.name).not.toMatch(DOLLAR_PATTERN);
      expect(f.description).not.toMatch(DOLLAR_PATTERN);
      for (const r of f.redFlagSignals) expect(r).not.toMatch(DOLLAR_PATTERN);
      for (const g of f.greenFlagSignals) expect(g).not.toMatch(DOLLAR_PATTERN);
    }
  });

  it('no enterprise readiness risk string field invents a dollar amount', () => {
    for (const r of listEnterpriseReadinessRisks()) {
      expect(r.name).not.toMatch(DOLLAR_PATTERN);
      expect(r.description).not.toMatch(DOLLAR_PATTERN);
      for (const m of r.mitigations) expect(m).not.toMatch(DOLLAR_PATTERN);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · build-buy-partner-framework.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/build-buy-partner-framework.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not use React state / effect hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not contain placeholder phrases', () => {
    expect(source).not.toMatch(/coming soon/i);
    expect(source).not.toMatch(/\bTBD\b/);
    expect(source).not.toMatch(/lorem ipsum/i);
  });

  it('does not endorse named AI vendors as branded recommendations', () => {
    const denyList = [
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft Copilot',
      'GitHub Copilot',
    ];
    for (const name of denyList) {
      expect(source.includes(name)).toBe(false);
    }
  });
});
