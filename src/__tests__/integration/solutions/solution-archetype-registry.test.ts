// SOL3 · Solution Archetype Registry tests.

import {
  SOLUTION_ARCHETYPE_KEYS,
  SOLUTION_ARCHETYPES,
  getSolutionArchetype,
  listSolutionArchetypes,
  recommendSolutionArchetypes,
  summarizeSolutionArchetypes,
  type SolutionArchetype,
  type SolutionArchetypeKey,
} from '@/lib/solutions/solution-archetype-registry';
import { AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER } from '@/lib/solutions/ai-led-pdlc-components';

const SOL2_KEY_SET = new Set<string>(
  AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER as ReadonlyArray<string>,
);

const DOLLAR_PATTERN = /\$\s?\d/;

const CANONICAL_KEYS: SolutionArchetypeKey[] = [
  'ai_led_pdlc_transformation',
  'analytics_modernization',
  'healthcare_ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_utilization_management',
  'kyc_customer_onboarding_ai',
  'predictive_maintenance_modernization',
  'build_buy_partner_evaluation',
  'service_operations_agentic_automation',
  'ai_governance_operating_model',
  'contact_center_ai_transformation',
  'finance_fpna_ai_automation',
];

// ---------------------------------------------------------------------
// All archetypes present + canonical order
// ---------------------------------------------------------------------

describe('listSolutionArchetypes', () => {
  it('returns exactly the 12 canonical archetypes in canonical order', () => {
    const archetypes = listSolutionArchetypes();
    expect(archetypes.length).toBe(12);
    expect(archetypes.map((a) => a.key)).toEqual(CANONICAL_KEYS);
    expect(SOLUTION_ARCHETYPE_KEYS).toEqual(CANONICAL_KEYS);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = listSolutionArchetypes();
    const b = listSolutionArchetypes();
    expect(a).toEqual(b);
  });

  it('serializes byte-equal across repeated calls', () => {
    const a = JSON.stringify(listSolutionArchetypes());
    const b = JSON.stringify(listSolutionArchetypes());
    expect(a).toBe(b);
  });

  it('SOLUTION_ARCHETYPES record is keyed by every canonical key', () => {
    for (const k of CANONICAL_KEYS) {
      expect(SOLUTION_ARCHETYPES[k]).toBeDefined();
      expect(SOLUTION_ARCHETYPES[k].key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Field set per archetype
// ---------------------------------------------------------------------

describe('every archetype carries the required field set', () => {
  it.each(CANONICAL_KEYS.map((k) => [k]))(
    '%s has full schema and meets array minimums',
    (k) => {
      const a = getSolutionArchetype(k as string);
      expect(a).not.toBeNull();
      const arch = a!;
      expect(arch.key).toBe(k);
      expect(arch.name.length).toBeGreaterThan(0);
      expect(arch.sector.length).toBeGreaterThan(0);
      expect(arch.capabilityFamily.length).toBeGreaterThan(0);
      expect(arch.problemStatement.length).toBeGreaterThan(0);
      expect(arch.businessOutcomes.length).toBeGreaterThanOrEqual(3);
      expect(arch.currentStateInputsRequired.length).toBeGreaterThanOrEqual(3);
      expect(arch.patternsUsed.length).toBeGreaterThanOrEqual(1);
      expect(arch.failureModesAddressed.length).toBeGreaterThanOrEqual(1);
      expect(arch.solutionComponents.length).toBeGreaterThanOrEqual(2);
      expect(arch.architectureBuildingBlocks.length).toBeGreaterThanOrEqual(3);
      expect(arch.workshopsRequired.length).toBeGreaterThanOrEqual(2);
      expect(arch.smesRequired.length).toBeGreaterThanOrEqual(2);
      expect(arch.buildBuyPartnerConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.governanceRiskConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.deliverablesGenerated.length).toBeGreaterThanOrEqual(2);
      expect(arch.valueMetrics.length).toBeGreaterThanOrEqual(2);
      expect(arch.recommendedFirstWorkshop.length).toBeGreaterThan(0);
      expect(arch.createdFrom).toBe('deterministic_solution_archetype_registry');

      // Agent roles: all four named, all non-empty.
      expect(arch.agentRoles).toBeDefined();
      expect(arch.agentRoles.nexus.trim().length).toBeGreaterThan(0);
      expect(arch.agentRoles.sentinel.trim().length).toBeGreaterThan(0);
      expect(arch.agentRoles.atlas.trim().length).toBeGreaterThan(0);
      expect(arch.agentRoles.steward.trim().length).toBeGreaterThan(0);
    },
  );

  it('every required string field is non-empty after trim across the registry', () => {
    for (const a of listSolutionArchetypes()) {
      const stringArrays: ReadonlyArray<ReadonlyArray<string>> = [
        a.businessOutcomes,
        a.currentStateInputsRequired,
        a.patternsUsed,
        a.failureModesAddressed,
        a.solutionComponents,
        a.architectureBuildingBlocks,
        a.workshopsRequired,
        a.smesRequired,
        a.buildBuyPartnerConsiderations,
        a.governanceRiskConsiderations,
        a.deliverablesGenerated,
        a.valueMetrics,
      ];
      for (const arr of stringArrays) {
        for (const item of arr) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// SOL2 cross-reference (AI-led PDLC archetype)
// ---------------------------------------------------------------------

describe('cross-reference to SOL2 (AI-led PDLC component pack)', () => {
  it('ai_led_pdlc_transformation.solutionComponents include at least one canonical SOL2 key', () => {
    const arch = getSolutionArchetype('ai_led_pdlc_transformation');
    expect(arch).not.toBeNull();
    const matches = arch!.solutionComponents.filter((c) => SOL2_KEY_SET.has(c));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// Domain-specific phrasing checks
// ---------------------------------------------------------------------

describe('analytics_modernization references data foundation, governance, semantic layer', () => {
  it('mentions the three concept tokens somewhere in the archetype strings', () => {
    const a = getSolutionArchetype('analytics_modernization');
    expect(a).not.toBeNull();
    const text = stringifyArchetype(a!).toLowerCase();
    expect(text).toContain('data foundation');
    expect(text).toContain('governance');
    expect(text).toContain('semantic layer');
  });
});

describe('healthcare archetypes reference clinical workflow + governance', () => {
  const HEALTHCARE_KEYS: SolutionArchetypeKey[] = [
    'healthcare_ambient_clinical_value_chain',
    'hcc_risk_adjustment_coding_accuracy',
    'prior_authorization_utilization_management',
  ];

  it.each(HEALTHCARE_KEYS.map((k) => [k]))(
    '%s mentions clinical workflow and governance',
    (k) => {
      const a = getSolutionArchetype(k as string);
      expect(a).not.toBeNull();
      const text = stringifyArchetype(a!).toLowerCase();
      expect(text).toContain('clinical workflow');
      expect(text).toContain('governance');
    },
  );
});

describe('build_buy_partner_evaluation references vendor and startup assessment', () => {
  it('mentions vendor and startup assessment language', () => {
    const a = getSolutionArchetype('build_buy_partner_evaluation');
    expect(a).not.toBeNull();
    const text = stringifyArchetype(a!).toLowerCase();
    expect(text).toContain('vendor');
    expect(text).toContain('startup');
    expect(text).toContain('assessment');
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getSolutionArchetype', () => {
  it('returns null for unknown keys', () => {
    expect(getSolutionArchetype('not-a-real-archetype')).toBeNull();
    expect(getSolutionArchetype('')).toBeNull();
    expect(getSolutionArchetype('value_ledger_incompleteness')).toBeNull();
    expect(getSolutionArchetype('context_as_code_foundation')).toBeNull();
  });

  it('returns the canonical record for every key', () => {
    for (const k of SOLUTION_ARCHETYPE_KEYS) {
      const a = getSolutionArchetype(k);
      expect(a).not.toBeNull();
      expect(a!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Recommend by sector / capability
// ---------------------------------------------------------------------

describe('recommendSolutionArchetypes', () => {
  it('returns empty when no sectors or capabilityKeywords are supplied', () => {
    expect(recommendSolutionArchetypes({})).toEqual([]);
    expect(recommendSolutionArchetypes({ sectors: [], capabilityKeywords: [] })).toEqual([]);
  });

  it('matches by sector substring', () => {
    const matched = recommendSolutionArchetypes({ sectors: ['healthcare'] });
    expect(matched.length).toBeGreaterThan(0);
    const keys = matched.map((m) => m.key);
    expect(keys).toContain('healthcare_ambient_clinical_value_chain');
    expect(keys).toContain('hcc_risk_adjustment_coding_accuracy');
    expect(keys).toContain('prior_authorization_utilization_management');
  });

  it('matches by capability keyword', () => {
    const matched = recommendSolutionArchetypes({ capabilityKeywords: ['contact center'] });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('contact_center_ai_transformation');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendSolutionArchetypes({
      sectors: ['cross_sector', 'healthcare_payer_provider'],
      capabilityKeywords: ['governance', 'data foundation'],
    });
    const b = recommendSolutionArchetypes({
      sectors: ['healthcare_payer_provider', 'cross_sector'],
      capabilityKeywords: ['data foundation', 'governance'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));

    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) => SOLUTION_ARCHETYPE_KEYS.indexOf(k));
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('ignores unknown sector / capability tokens without throwing', () => {
    const matched = recommendSolutionArchetypes({
      sectors: ['definitely_not_a_sector'],
      capabilityKeywords: ['definitely_not_a_capability_token'],
    });
    expect(matched).toEqual([]);
  });

  it('union semantics: an archetype matched by sector OR by keyword appears once', () => {
    const matched = recommendSolutionArchetypes({
      sectors: ['banking'],
      capabilityKeywords: ['kyc'],
    });
    const keys = matched.map((m) => m.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
    expect(keys).toContain('kyc_customer_onboarding_ai');
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      sectors: ['cross_sector'],
      capabilityKeywords: ['governance'],
    };
    const a = recommendSolutionArchetypes(input);
    const b = recommendSolutionArchetypes(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('ignores empty / whitespace-only tokens without throwing', () => {
    const matched = recommendSolutionArchetypes({
      sectors: ['', '   '],
      capabilityKeywords: ['', '\t'],
    });
    expect(matched).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeSolutionArchetypes', () => {
  it('totalCount equals the canonical archetype count when default is used', () => {
    const s = summarizeSolutionArchetypes();
    expect(s.totalCount).toBe(12);
  });

  it('sectors is sorted ascending', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.sectors].sort();
    expect(s.sectors).toEqual(sorted);
  });

  it('uniqueWorkshops is sorted ascending', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.uniqueWorkshops].sort();
    expect(s.uniqueWorkshops).toEqual(sorted);
  });

  it('uniqueArchitectureBlocks is sorted ascending', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.uniqueArchitectureBlocks].sort();
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizeSolutionArchetypes();
    const b = summarizeSolutionArchetypes();
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('summarizes a custom subset when provided', () => {
    const subset = listSolutionArchetypes().filter(
      (a) => a.sector === 'healthcare_payer_provider',
    );
    const s = summarizeSolutionArchetypes(subset);
    expect(s.totalCount).toBe(subset.length);
    expect(s.sectors).toEqual(['healthcare_payer_provider']);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no archetype invents a dollar amount in any string field', () => {
    const blob = JSON.stringify(SOLUTION_ARCHETYPES);
    expect(blob).not.toMatch(DOLLAR_PATTERN);
  });

  it('every archetype is tagged createdFrom: deterministic_solution_archetype_registry', () => {
    for (const a of listSolutionArchetypes()) {
      expect(a.createdFrom).toBe('deterministic_solution_archetype_registry');
    }
  });

  it('no archetype string contains banned placeholder phrases', () => {
    const banned = [/coming soon/i, /\btbd\b/i, /lorem ipsum/i];
    for (const a of listSolutionArchetypes()) {
      const text = stringifyArchetype(a);
      for (const p of banned) {
        expect(text).not.toMatch(p);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · solution-archetype-registry.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/solution-archetype-registry.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
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
    expect(codeOnly).not.toMatch(/fetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime or React state hooks', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/useState/);
    expect(codeOnly).not.toMatch(/useEffect/);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function stringifyArchetype(a: SolutionArchetype): string {
  return [
    a.key,
    a.name,
    a.sector,
    a.capabilityFamily,
    a.problemStatement,
    a.recommendedFirstWorkshop,
    ...a.businessOutcomes,
    ...a.currentStateInputsRequired,
    ...a.patternsUsed,
    ...a.failureModesAddressed,
    ...a.solutionComponents,
    ...a.architectureBuildingBlocks,
    ...a.workshopsRequired,
    ...a.smesRequired,
    ...a.buildBuyPartnerConsiderations,
    ...a.governanceRiskConsiderations,
    ...a.deliverablesGenerated,
    ...a.valueMetrics,
    a.agentRoles.nexus,
    a.agentRoles.sentinel,
    a.agentRoles.atlas,
    a.agentRoles.steward,
  ].join(' | ');
}
