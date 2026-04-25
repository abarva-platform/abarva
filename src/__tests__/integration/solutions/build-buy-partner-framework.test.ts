// SOL6 · Build / Buy / Partner Decision Framework tests.

import {
  BUILD_BUY_PARTNER_CRITERIA,
  BUILD_BUY_PARTNER_CRITERION_DESCRIPTORS,
  evaluateBuildBuyPartnerScenario,
  listBuildBuyPartnerCriteria,
  summarizeBuildBuyPartnerRecommendation,
  type BuildBuyPartnerCriterion,
  type BuildBuyPartnerScenarioInput,
} from '@/lib/solutions/build-buy-partner-framework';

const DOLLAR_PATTERN = /\$\s?\d/;

const EXPECTED_CRITERIA: BuildBuyPartnerCriterion[] = [
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
];

// ---------------------------------------------------------------------
// Canonical criteria coverage + order
// ---------------------------------------------------------------------

describe('BUILD_BUY_PARTNER_CRITERIA', () => {
  it('contains exactly 12 criteria in canonical order', () => {
    expect(BUILD_BUY_PARTNER_CRITERIA.length).toBe(12);
    expect([...BUILD_BUY_PARTNER_CRITERIA]).toEqual(EXPECTED_CRITERIA);
  });

  it('listBuildBuyPartnerCriteria returns descriptors in canonical order', () => {
    const descriptors = listBuildBuyPartnerCriteria();
    expect(descriptors.length).toBe(12);
    expect(descriptors.map((d) => d.key)).toEqual(EXPECTED_CRITERIA);
  });

  it('listBuildBuyPartnerCriteria is byte-equal across repeated calls', () => {
    const a = JSON.stringify(listBuildBuyPartnerCriteria());
    const b = JSON.stringify(listBuildBuyPartnerCriteria());
    expect(a).toBe(b);
  });

  it('every descriptor has non-empty name, description, buildSignal, buySignal, partnerSignal', () => {
    for (const k of EXPECTED_CRITERIA) {
      const d = BUILD_BUY_PARTNER_CRITERION_DESCRIPTORS[k];
      expect(d.key).toBe(k);
      expect(d.name.trim().length).toBeGreaterThan(0);
      expect(d.description.trim().length).toBeGreaterThan(0);
      expect(d.buildSignal.trim().length).toBeGreaterThan(0);
      expect(d.buySignal.trim().length).toBeGreaterThan(0);
      expect(d.partnerSignal.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('evaluateBuildBuyPartnerScenario · determinism', () => {
  it('returns deeply equal output across two calls with the same input', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Underwriting copilot',
      capabilityName: 'underwriting copilot',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: true,
      criticalRiskTags: ['model_drift', 'phi_exposure'],
      constraints: ['regulator_attestation_required'],
    };
    const a = evaluateBuildBuyPartnerScenario(input);
    const b = evaluateBuildBuyPartnerScenario(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Build rule
// ---------------------------------------------------------------------

describe('build rule fires', () => {
  it('high differentiation + established internal capability → build, high confidence', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Pricing optimization platform',
      capabilityName: 'pricing optimization platform',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('build');
    expect(r.confidence).toBe('high');
    expect(r.scenarioName).toBe('Pricing optimization platform');
    expect(r.rationale.length).toBeGreaterThanOrEqual(2);
    expect(r.tradeoffs.length).toBeGreaterThanOrEqual(2);
    expect(r.createdFrom).toBe('deterministic_build_buy_partner_framework');
  });

  it('high differentiation + emerging internal capability → build, medium confidence (borderline)', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Knowledge agent platform',
      capabilityName: 'knowledge agent platform',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('build');
    expect(r.confidence).toBe('medium');
  });
});

// ---------------------------------------------------------------------
// Buy rule
// ---------------------------------------------------------------------

describe('buy rule fires', () => {
  it('low differentiation + mature market + high urgency → buy', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Standard customer support ticketing',
      capabilityName: 'customer support ticketing',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('buy');
    expect(r.confidence).toBe('high');
    expect(r.rationale.length).toBeGreaterThanOrEqual(2);
    expect(r.tradeoffs.length).toBeGreaterThanOrEqual(2);
  });

  it('medium differentiation + mature market + high urgency → buy', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Standard expense management',
      capabilityName: 'expense management',
      differentiationLevel: 'medium',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('buy');
  });
});

// ---------------------------------------------------------------------
// Partner rule
// ---------------------------------------------------------------------

describe('partner rule fires', () => {
  it('medium differentiation + fragmented market + high urgency → partner', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Document intelligence pipeline',
      capabilityName: 'document intelligence pipeline',
      differentiationLevel: 'medium',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('partner');
    expect(r.confidence).toBe('high');
    expect(r.rationale.length).toBeGreaterThanOrEqual(2);
    expect(r.tradeoffs.length).toBeGreaterThanOrEqual(2);
  });

  it('high differentiation + fragmented market + high urgency → partner (rule precedence: build wins only when internal capacity present)', () => {
    // When differentiation high BUT internal capability is absent, build rule does NOT fire,
    // so partner rule fires next under high urgency + fragmented market.
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Differentiated document intelligence pipeline',
      capabilityName: 'differentiated document intelligence pipeline',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('partner');
    // Borderline: internal capability absent → medium confidence per rule.
    expect(r.confidence).toBe('medium');
  });
});

// ---------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------

describe('fallback when no rule fires', () => {
  it('falls back to partner with low confidence', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Ambiguous capability scenario',
      capabilityName: 'ambiguous capability',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'nascent',
      timeToValueUrgency: 'low',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('partner');
    expect(r.confidence).toBe('low');
    expect(r.rationale.length).toBeGreaterThanOrEqual(2);
    expect(r.tradeoffs.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// Governance warnings
// ---------------------------------------------------------------------

describe('governance warnings', () => {
  it('regulated context produces at least one governanceWarnings entry', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Clinical decision support',
      capabilityName: 'clinical decision support',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: true,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.governanceWarnings.length).toBeGreaterThanOrEqual(1);
    const text = r.governanceWarnings.join(' | ').toLowerCase();
    expect(text).toContain('regulated');
  });

  it('critical risk tags surface in governanceWarnings', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Tagged capability scenario',
      capabilityName: 'tagged capability',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: ['model_drift', 'phi_exposure'],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.governanceWarnings.length).toBeGreaterThanOrEqual(1);
    const text = r.governanceWarnings.join(' | ');
    expect(text).toContain('model_drift');
    expect(text).toContain('phi_exposure');
  });

  it('regulated context plus critical risk tags surfaces both warnings', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Regulated tagged scenario',
      capabilityName: 'regulated tagged capability',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: true,
      criticalRiskTags: ['model_drift'],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.governanceWarnings.length).toBeGreaterThanOrEqual(2);
  });

  it('no regulated context and no critical risk tags → governanceWarnings is empty', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Quiet capability scenario',
      capabilityName: 'quiet capability',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.governanceWarnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Vendor / startup assessment factors
// ---------------------------------------------------------------------

describe('vendorStartupAssessmentFactors', () => {
  it('is empty for build recommendations', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Build path scenario',
      capabilityName: 'build capability',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('build');
    expect(r.vendorStartupAssessmentFactors).toEqual([]);
  });

  it('is non-empty for buy recommendations', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Buy path scenario',
      capabilityName: 'buy capability',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('buy');
    expect(r.vendorStartupAssessmentFactors.length).toBeGreaterThanOrEqual(6);
    for (const f of r.vendorStartupAssessmentFactors) {
      expect(f.key.length).toBeGreaterThan(0);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.definition.length).toBeGreaterThan(0);
      expect(f.assessmentQuestions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('is non-empty for partner recommendations', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Partner path scenario',
      capabilityName: 'partner capability',
      differentiationLevel: 'medium',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    expect(r.recommendedOption).toBe('partner');
    expect(r.vendorStartupAssessmentFactors.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------
// Enterprise readiness risks
// ---------------------------------------------------------------------

describe('enterpriseReadinessRisks', () => {
  const allCases: BuildBuyPartnerScenarioInput[] = [
    {
      scenarioName: 'Build path',
      capabilityName: 'build capability',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: false,
      criticalRiskTags: [],
    },
    {
      scenarioName: 'Buy path',
      capabilityName: 'buy capability',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    },
    {
      scenarioName: 'Partner path',
      capabilityName: 'partner capability',
      differentiationLevel: 'medium',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    },
    {
      scenarioName: 'Fallback path',
      capabilityName: 'fallback capability',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'nascent',
      timeToValueUrgency: 'low',
      regulatedContext: false,
      criticalRiskTags: [],
    },
  ];

  it('is non-empty for every recommendation regardless of option', () => {
    for (const input of allCases) {
      const r = evaluateBuildBuyPartnerScenario(input);
      expect(r.enterpriseReadinessRisks.length).toBeGreaterThanOrEqual(4);
      for (const risk of r.enterpriseReadinessRisks) {
        expect(risk.key.length).toBeGreaterThan(0);
        expect(risk.name.length).toBeGreaterThan(0);
        expect(risk.description.length).toBeGreaterThan(0);
        expect(risk.mitigation.length).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(risk.severity);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary helper
// ---------------------------------------------------------------------

describe('summarizeBuildBuyPartnerRecommendation', () => {
  it('returns headline, topRationale, and warningsCount', () => {
    const input: BuildBuyPartnerScenarioInput = {
      scenarioName: 'Summary scenario',
      capabilityName: 'summary capability',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: true,
      criticalRiskTags: ['model_drift'],
    };
    const r = evaluateBuildBuyPartnerScenario(input);
    const s = summarizeBuildBuyPartnerRecommendation(r);
    expect(s.headline).toContain('Build');
    expect(s.headline).toContain('Summary scenario');
    expect(s.topRationale.length).toBeGreaterThan(0);
    expect(s.warningsCount).toBe(r.governanceWarnings.length);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  const cases: BuildBuyPartnerScenarioInput[] = [
    {
      scenarioName: 'Case A',
      capabilityName: 'capability A',
      differentiationLevel: 'high',
      internalCapabilityMaturity: 'established',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'medium',
      regulatedContext: true,
      criticalRiskTags: ['phi_exposure'],
    },
    {
      scenarioName: 'Case B',
      capabilityName: 'capability B',
      differentiationLevel: 'low',
      internalCapabilityMaturity: 'absent',
      marketCapabilityMaturity: 'mature',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    },
    {
      scenarioName: 'Case C',
      capabilityName: 'capability C',
      differentiationLevel: 'medium',
      internalCapabilityMaturity: 'emerging',
      marketCapabilityMaturity: 'fragmented',
      timeToValueUrgency: 'high',
      regulatedContext: false,
      criticalRiskTags: [],
    },
  ];

  it('no recommendation invents a dollar amount in any string field', () => {
    for (const input of cases) {
      const r = evaluateBuildBuyPartnerScenario(input);
      const stringFields: string[] = [
        r.scenarioName,
        ...r.rationale,
        ...r.tradeoffs,
        ...r.governanceWarnings,
        ...r.vendorStartupAssessmentFactors.flatMap((f) => [
          f.key,
          f.name,
          f.definition,
          ...f.assessmentQuestions,
        ]),
        ...r.enterpriseReadinessRisks.flatMap((rk) => [
          rk.key,
          rk.name,
          rk.description,
          rk.mitigation,
        ]),
      ];
      for (const f of stringFields) {
        expect(f).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('every recommendation is tagged createdFrom: deterministic_build_buy_partner_framework', () => {
    for (const input of cases) {
      const r = evaluateBuildBuyPartnerScenario(input);
      expect(r.createdFrom).toBe('deterministic_build_buy_partner_framework');
    }
  });
});

// ---------------------------------------------------------------------
// No vendor endorsement
// ---------------------------------------------------------------------

describe('no vendor endorsement in source', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/build-buy-partner-framework.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('does not contain branded vendor names presented as endorsements', () => {
    const denyList = ['Snowflake', 'Databricks', 'Epic', 'Microsoft Azure'];
    for (const name of denyList) {
      expect(source).not.toContain(name);
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

  it('does not import next/* or React', () => {
    expect(codeOnly).not.toMatch(/from 'next\//);
    expect(codeOnly).not.toMatch(/from 'react'/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / supabase runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/supabase/i);
  });
});
