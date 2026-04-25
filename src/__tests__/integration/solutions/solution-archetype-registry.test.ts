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
import * as fs from 'fs';
import * as path from 'path';

const PDLC_COMPONENT_KEY_SET = new Set<string>(
  AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER as ReadonlyArray<string>,
);

const DOLLAR_PATTERN = /\$\s*\d/;

const EXPECTED_KEYS: SolutionArchetypeKey[] = [
  'ai_led_pdlc_transformation',
  'analytics_modernization',
  'healthcare_ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_utilization_management',
  'kyc_customer_onboarding_ai',
  'predictive_maintenance_modernization',
  'build_buy_partner_evaluation',
];

// ---------------------------------------------------------------------
// Canonical order + presence
// ---------------------------------------------------------------------

describe('SOLUTION_ARCHETYPE_KEYS + listSolutionArchetypes', () => {
  it('exports exactly the eight canonical archetype keys in canonical order', () => {
    expect(SOLUTION_ARCHETYPE_KEYS.length).toBe(8);
    expect([...SOLUTION_ARCHETYPE_KEYS]).toEqual(EXPECTED_KEYS);
  });

  it('listSolutionArchetypes returns the same eight in canonical order', () => {
    const archetypes = listSolutionArchetypes();
    expect(archetypes.length).toBe(8);
    expect(archetypes.map((a) => a.key)).toEqual(EXPECTED_KEYS);
  });

  it('listSolutionArchetypes is byte-equal across two calls', () => {
    const a = JSON.stringify(listSolutionArchetypes());
    const b = JSON.stringify(listSolutionArchetypes());
    expect(a).toBe(b);
  });

  it('SOLUTION_ARCHETYPES exposes a record keyed by canonical keys', () => {
    for (const k of EXPECTED_KEYS) {
      expect(SOLUTION_ARCHETYPES[k]).toBeDefined();
      expect(SOLUTION_ARCHETYPES[k].key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Field set per archetype
// ---------------------------------------------------------------------

describe('every archetype carries the full required field set', () => {
  it.each(EXPECTED_KEYS.map((k) => [k]))(
    '%s has full schema and meets array minimums',
    (k) => {
      const a = getSolutionArchetype(k as string);
      expect(a).not.toBeNull();
      const arch = a as SolutionArchetype;
      expect(arch.key).toBe(k);
      expect(arch.name.trim().length).toBeGreaterThan(0);
      expect(arch.sector.trim().length).toBeGreaterThan(0);
      expect(arch.problemStatement.trim().length).toBeGreaterThan(0);
      expect(arch.businessOutcomes.length).toBeGreaterThanOrEqual(3);
      expect(arch.currentStateInputsRequired.length).toBeGreaterThanOrEqual(3);
      expect(arch.patternsUsed.length).toBeGreaterThanOrEqual(1);
      expect(arch.solutionComponents.length).toBeGreaterThanOrEqual(2);
      expect(arch.architectureBuildingBlocks.length).toBeGreaterThanOrEqual(3);
      expect(arch.workshopsRequired.length).toBeGreaterThanOrEqual(2);
      expect(arch.smesRequired.length).toBeGreaterThanOrEqual(2);
      expect(arch.buildBuyPartnerConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.governanceRiskConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.deliverablesGenerated.length).toBeGreaterThanOrEqual(2);
      expect(arch.valueMetrics.length).toBeGreaterThanOrEqual(2);
      expect(arch.createdFrom).toBe('deterministic_solution_archetype_registry');
    },
  );

  it('every required string field is non-empty after trim', () => {
    for (const a of listSolutionArchetypes()) {
      const arrays: ReadonlyArray<ReadonlyArray<string>> = [
        a.businessOutcomes,
        a.currentStateInputsRequired,
        a.patternsUsed,
        a.solutionComponents,
        a.architectureBuildingBlocks,
        a.workshopsRequired,
        a.smesRequired,
        a.buildBuyPartnerConsiderations,
        a.governanceRiskConsiderations,
        a.deliverablesGenerated,
        a.valueMetrics,
      ];
      for (const arr of arrays) {
        for (const item of arr) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every archetype has all four agentRoles populated', () => {
    for (const a of listSolutionArchetypes()) {
      expect(a.agentRoles.nexus.trim().length).toBeGreaterThan(0);
      expect(a.agentRoles.sentinel.trim().length).toBeGreaterThan(0);
      expect(a.agentRoles.atlas.trim().length).toBeGreaterThan(0);
      expect(a.agentRoles.steward.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// SOL2 cross-reference for ai_led_pdlc_transformation
// ---------------------------------------------------------------------

describe('ai_led_pdlc_transformation references canonical SOL2 component keys', () => {
  it('at least one solutionComponents entry is a canonical AiLedPdlcComponentKey', () => {
    const arch = getSolutionArchetype('ai_led_pdlc_transformation');
    expect(arch).not.toBeNull();
    const matches = arch!.solutionComponents.filter((c) => PDLC_COMPONENT_KEY_SET.has(c));
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getSolutionArchetype', () => {
  it('returns null for unknown keys', () => {
    expect(getSolutionArchetype('not-a-real-archetype')).toBeNull();
    expect(getSolutionArchetype('')).toBeNull();
    expect(getSolutionArchetype('context_as_code_foundation')).toBeNull();
  });

  it('returns the canonical record for every key', () => {
    for (const k of EXPECTED_KEYS) {
      const a = getSolutionArchetype(k);
      expect(a).not.toBeNull();
      expect(a!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Recommend
// ---------------------------------------------------------------------

describe('recommendSolutionArchetypes', () => {
  it('returns empty when no sectors or capabilityKeywords are supplied', () => {
    expect(recommendSolutionArchetypes({})).toEqual([]);
    expect(recommendSolutionArchetypes({ sectors: [], capabilityKeywords: [] })).toEqual([]);
  });

  it('matches by sector substring', () => {
    const matched = recommendSolutionArchetypes({ sectors: ['Healthcare'] });
    const keys = matched.map((a) => a.key);
    expect(keys).toContain('healthcare_ambient_clinical_value_chain');
    expect(keys).toContain('hcc_risk_adjustment_coding_accuracy');
    expect(keys).toContain('prior_authorization_utilization_management');
    expect(keys).not.toContain('kyc_customer_onboarding_ai');
  });

  it('matches by capability keyword against name / problemStatement / businessOutcomes', () => {
    const matched = recommendSolutionArchetypes({
      capabilityKeywords: ['DORA'],
    });
    expect(matched.map((a) => a.key)).toContain('ai_led_pdlc_transformation');
  });

  it('union semantics on sectors OR capabilityKeywords', () => {
    const matched = recommendSolutionArchetypes({
      sectors: ['Financial services'],
      capabilityKeywords: ['predictive maintenance'],
    });
    const keys = matched.map((a) => a.key);
    expect(keys).toContain('kyc_customer_onboarding_ai');
    expect(keys).toContain('predictive_maintenance_modernization');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendSolutionArchetypes({
      sectors: ['Cross-industry', 'Healthcare'],
    });
    const b = recommendSolutionArchetypes({
      sectors: ['Healthcare', 'Cross-industry'],
    });
    expect(a.map((x) => x.key)).toEqual(b.map((x) => x.key));
    const aKeys = a.map((x) => x.key);
    const idx = aKeys.map((k) => EXPECTED_KEYS.indexOf(k));
    const sorted = [...idx].sort((x, y) => x - y);
    expect(idx).toEqual(sorted);
  });

  it('ignores unknown sector and keyword tokens without throwing', () => {
    const matched = recommendSolutionArchetypes({
      sectors: ['Definitely-Not-A-Sector'],
      capabilityKeywords: ['definitely-not-a-keyword'],
    });
    expect(matched).toEqual([]);
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      sectors: ['Healthcare'],
      capabilityKeywords: ['onboarding'],
    };
    const a = recommendSolutionArchetypes(input);
    const b = recommendSolutionArchetypes(input);
    expect(a.map((x) => x.key)).toEqual(b.map((x) => x.key));
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeSolutionArchetypes', () => {
  it('totalCount is 8', () => {
    expect(summarizeSolutionArchetypes().totalCount).toBe(8);
  });

  it('sectors is sorted ascending and contains every archetype sector', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.sectors].sort();
    expect(s.sectors).toEqual(sorted);
    const archetypeSectors = new Set(listSolutionArchetypes().map((a) => a.sector));
    for (const sec of archetypeSectors) {
      expect(s.sectors).toContain(sec);
    }
  });

  it('uniqueWorkshops is sorted ascending', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.uniqueWorkshops].sort();
    expect(s.uniqueWorkshops).toEqual(sorted);
    expect(s.uniqueWorkshops.length).toBeGreaterThan(0);
  });

  it('uniqueArchitectureBlocks is sorted ascending', () => {
    const s = summarizeSolutionArchetypes();
    const sorted = [...s.uniqueArchitectureBlocks].sort();
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
    expect(s.uniqueArchitectureBlocks.length).toBeGreaterThan(0);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizeSolutionArchetypes();
    const b = summarizeSolutionArchetypes();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// No invented dollar amounts
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('JSON.stringify(SOLUTION_ARCHETYPES) does not match a dollar-amount pattern', () => {
    const blob = JSON.stringify(SOLUTION_ARCHETYPES);
    expect(blob).not.toMatch(DOLLAR_PATTERN);
  });

  it('every archetype is tagged createdFrom: deterministic_solution_archetype_registry', () => {
    for (const a of listSolutionArchetypes()) {
      expect(a.createdFrom).toBe('deterministic_solution_archetype_registry');
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · solution-archetype-registry.ts', () => {
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

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI / Supabase', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/supabase/i);
  });

  it('does not import auth / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/auth/);
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/source/);
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/sentinel/);
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/atlas/);
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/nexus/);
    expect(codeOnly).not.toMatch(/['"]@?\/?lib\/agent/);
  });

  it('does not import next/* or React', () => {
    expect(codeOnly).not.toMatch(/from ['"]next\//);
    expect(codeOnly).not.toMatch(/from ['"]react['"]/);
  });
});
