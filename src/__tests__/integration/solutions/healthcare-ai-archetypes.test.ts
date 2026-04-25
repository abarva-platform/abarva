// SOL5 · Healthcare AI Solution Archetypes tests.

import {
  HEALTHCARE_AI_ARCHETYPE_KEYS,
  HEALTHCARE_AI_ARCHETYPES,
  getHealthcareAiArchetype,
  listHealthcareAiArchetypes,
  recommendHealthcareAiArchetypes,
  summarizeHealthcareAiArchetypes,
  type HealthcareAiArchetype,
  type HealthcareAiArchetypeKey,
} from '@/lib/solutions/healthcare-ai-archetypes';

const DOLLAR_PATTERN = /\$\s?\d/;

const EXPECTED_KEYS: HealthcareAiArchetypeKey[] = [
  'ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_automation',
  'clinical_documentation_improvement',
  'care_management_next_best_action',
  'patient_access_scheduling_optimization',
  'revenue_integrity_ai',
  'population_health_analytics',
];

function archetypeFieldsToString(a: HealthcareAiArchetype): string {
  return [
    a.key,
    a.name,
    a.clinicalBusinessProblem,
    ...a.workflowImpacted,
    ...a.currentStateInputsRequired,
    ...a.dataSourcesRequired,
    ...a.architectureBuildingBlocks,
    ...a.vendorStartupConsiderations,
    ...a.buildBuyPartnerConsiderations,
    ...a.governanceRiskConsiderations,
    ...a.valueMetrics,
    ...a.requiredWorkshops,
    ...a.smesRequired,
    ...a.deliverablesGenerated,
    ...a.patternsUsed,
    a.createdFrom,
  ].join(' | ');
}

// ---------------------------------------------------------------------
// All archetypes present + canonical order
// ---------------------------------------------------------------------

describe('listHealthcareAiArchetypes', () => {
  it('returns exactly 8 archetypes in canonical order', () => {
    const archetypes = listHealthcareAiArchetypes();
    expect(archetypes.length).toBe(8);
    expect(archetypes.map((a) => a.key)).toEqual(EXPECTED_KEYS);
    expect(HEALTHCARE_AI_ARCHETYPE_KEYS).toEqual(EXPECTED_KEYS);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = listHealthcareAiArchetypes();
    const b = listHealthcareAiArchetypes();
    expect(a).toEqual(b);
  });

  it('serializes byte-equal across repeated calls', () => {
    const a = JSON.stringify(listHealthcareAiArchetypes());
    const b = JSON.stringify(listHealthcareAiArchetypes());
    expect(a).toBe(b);
  });

  it('exposes the registry keyed by archetype key', () => {
    for (const k of EXPECTED_KEYS) {
      expect(HEALTHCARE_AI_ARCHETYPES[k]).toBeDefined();
      expect(HEALTHCARE_AI_ARCHETYPES[k].key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Field-set / minimum-cardinality per archetype
// ---------------------------------------------------------------------

describe('every archetype carries the required field set and minimums', () => {
  it.each(EXPECTED_KEYS.map((k) => [k]))(
    '%s has full schema and meets array minimums',
    (k) => {
      const a = getHealthcareAiArchetype(k as string);
      expect(a).not.toBeNull();
      const arch = a!;
      expect(arch.key).toBe(k);
      expect(arch.name.length).toBeGreaterThan(0);
      expect(arch.clinicalBusinessProblem.length).toBeGreaterThan(0);
      expect(arch.workflowImpacted.length).toBeGreaterThanOrEqual(2);
      expect(arch.currentStateInputsRequired.length).toBeGreaterThanOrEqual(3);
      expect(arch.dataSourcesRequired.length).toBeGreaterThanOrEqual(3);
      expect(arch.architectureBuildingBlocks.length).toBeGreaterThanOrEqual(3);
      expect(arch.vendorStartupConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.buildBuyPartnerConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.governanceRiskConsiderations.length).toBeGreaterThanOrEqual(2);
      expect(arch.valueMetrics.length).toBeGreaterThanOrEqual(2);
      expect(arch.requiredWorkshops.length).toBeGreaterThanOrEqual(2);
      expect(arch.smesRequired.length).toBeGreaterThanOrEqual(2);
      expect(arch.deliverablesGenerated.length).toBeGreaterThanOrEqual(2);
      expect(arch.patternsUsed.length).toBeGreaterThanOrEqual(1);
      expect(arch.createdFrom).toBe('deterministic_healthcare_archetype_pack');
    },
  );

  it('every required string field is non-empty after trim', () => {
    for (const a of listHealthcareAiArchetypes()) {
      expect(a.name.trim().length).toBeGreaterThan(0);
      expect(a.clinicalBusinessProblem.trim().length).toBeGreaterThan(0);
      const arrays: ReadonlyArray<ReadonlyArray<string>> = [
        a.workflowImpacted,
        a.currentStateInputsRequired,
        a.dataSourcesRequired,
        a.architectureBuildingBlocks,
        a.vendorStartupConsiderations,
        a.buildBuyPartnerConsiderations,
        a.governanceRiskConsiderations,
        a.valueMetrics,
        a.requiredWorkshops,
        a.smesRequired,
        a.deliverablesGenerated,
        a.patternsUsed,
      ];
      for (const arr of arrays) {
        for (const item of arr) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Ambient downstream workflow coverage
// ---------------------------------------------------------------------

describe('ambient_clinical_value_chain downstream workflow coverage', () => {
  it('workflowImpacted has at least 2 downstream workflow entries hitting coding / billing / quality', () => {
    const a = getHealthcareAiArchetype('ambient_clinical_value_chain');
    expect(a).not.toBeNull();
    const wf = a!.workflowImpacted;
    expect(wf.length).toBeGreaterThanOrEqual(2);
    const downstreamHits = wf.filter((entry) => {
      const lower = entry.toLowerCase();
      return (
        lower.includes('coding') ||
        lower.includes('billing') ||
        lower.includes('quality')
      );
    });
    expect(downstreamHits.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// HCC downstream workflow coverage
// ---------------------------------------------------------------------

describe('hcc_risk_adjustment_coding_accuracy downstream workflow coverage', () => {
  it('workflowImpacted contains entries mentioning RAF or submission or audit', () => {
    const a = getHealthcareAiArchetype('hcc_risk_adjustment_coding_accuracy');
    expect(a).not.toBeNull();
    const wf = a!.workflowImpacted;
    const hits = wf.filter((entry) => {
      const lower = entry.toLowerCase();
      return (
        entry.includes('RAF') ||
        lower.includes('submission') ||
        lower.includes('audit')
      );
    });
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// Prior authorization required substrings
// ---------------------------------------------------------------------

describe('prior_authorization_automation required substrings', () => {
  it('includes the literal substrings "evidence packet", "clinical policy", and "payer workflow" somewhere across its fields', () => {
    const a = getHealthcareAiArchetype('prior_authorization_automation');
    expect(a).not.toBeNull();
    const text = archetypeFieldsToString(a!);
    expect(text).toContain('evidence packet');
    expect(text).toContain('clinical policy');
    expect(text).toContain('payer workflow');
  });
});

// ---------------------------------------------------------------------
// Vendor branding deny-list
// ---------------------------------------------------------------------

describe('vendorStartupConsiderations does not present named brands as endorsements', () => {
  // We intentionally scan vendorStartupConsiderations only; the rest of
  // the module may legitimately reference named EHR systems (e.g.,
  // "Epic, Cerner") as data-source examples.
  const denyList = [
    'Suki',
    'Nuance DAX',
    'Abridge',
    'Epic-specific endorsement',
  ];

  it('no archetype lists a denied brand inside vendorStartupConsiderations', () => {
    for (const a of listHealthcareAiArchetypes()) {
      const text = a.vendorStartupConsiderations.join(' | ');
      for (const banned of denyList) {
        expect(text).not.toContain(banned);
      }
    }
  });
});

// ---------------------------------------------------------------------
// No invented dollar amounts
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no archetype invents a dollar amount in any string field', () => {
    for (const a of listHealthcareAiArchetypes()) {
      const stringFields: string[] = [
        a.name,
        a.clinicalBusinessProblem,
        ...a.workflowImpacted,
        ...a.currentStateInputsRequired,
        ...a.dataSourcesRequired,
        ...a.architectureBuildingBlocks,
        ...a.vendorStartupConsiderations,
        ...a.buildBuyPartnerConsiderations,
        ...a.governanceRiskConsiderations,
        ...a.valueMetrics,
        ...a.requiredWorkshops,
        ...a.smesRequired,
        ...a.deliverablesGenerated,
      ];
      for (const f of stringFields) {
        expect(f).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('every archetype is tagged createdFrom: deterministic_healthcare_archetype_pack', () => {
    for (const a of listHealthcareAiArchetypes()) {
      expect(a.createdFrom).toBe('deterministic_healthcare_archetype_pack');
    }
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getHealthcareAiArchetype', () => {
  it('returns null for unknown keys', () => {
    expect(getHealthcareAiArchetype('not-a-real-archetype')).toBeNull();
    expect(getHealthcareAiArchetype('')).toBeNull();
    expect(getHealthcareAiArchetype('weak_data_foundation')).toBeNull();
    expect(getHealthcareAiArchetype('value_ledger_incompleteness')).toBeNull();
  });

  it('returns the canonical record for every key', () => {
    for (const k of HEALTHCARE_AI_ARCHETYPE_KEYS) {
      const a = getHealthcareAiArchetype(k);
      expect(a).not.toBeNull();
      expect(a!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Recommend
// ---------------------------------------------------------------------

describe('recommendHealthcareAiArchetypes', () => {
  it('returns empty when no keywords supplied', () => {
    expect(recommendHealthcareAiArchetypes({})).toEqual([]);
    expect(recommendHealthcareAiArchetypes({ workflowKeywords: [], valueDriverKeywords: [] })).toEqual([]);
  });

  it('matches by workflow keyword substring', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['authorization'],
    });
    expect(matched.map((m) => m.key)).toContain('prior_authorization_automation');
  });

  it('matches by value-driver keyword substring', () => {
    const matched = recommendHealthcareAiArchetypes({
      valueDriverKeywords: ['no-show'],
    });
    expect(matched.map((m) => m.key)).toContain('patient_access_scheduling_optimization');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendHealthcareAiArchetypes({
      workflowKeywords: ['coding', 'authorization'],
    });
    const b = recommendHealthcareAiArchetypes({
      workflowKeywords: ['authorization', 'coding'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));
    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) =>
      HEALTHCARE_AI_ARCHETYPE_KEYS.indexOf(k),
    );
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('ignores unknown keywords without throwing and returns empty when nothing matches', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['definitely-not-a-real-workflow-term-xyzzy'],
      valueDriverKeywords: ['definitely-not-a-real-value-term-xyzzy'],
    });
    expect(matched).toEqual([]);
  });

  it('union semantics: an archetype matched by workflow OR value driver appears once', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['authorization'],
      valueDriverKeywords: ['authorization'],
    });
    const keys = matched.map((c) => c.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      workflowKeywords: ['quality', 'coding'],
      valueDriverKeywords: ['trend'],
    };
    const x = recommendHealthcareAiArchetypes(input);
    const y = recommendHealthcareAiArchetypes(input);
    expect(x).toEqual(y);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeHealthcareAiArchetypes', () => {
  it('totalCount equals 8 (canonical pack size)', () => {
    const s = summarizeHealthcareAiArchetypes();
    expect(s.totalCount).toBe(8);
  });

  it('uniqueWorkflows is sorted ascending', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueWorkflows].sort();
    expect(s.uniqueWorkflows).toEqual(sorted);
  });

  it('uniqueArchitectureBlocks is sorted ascending', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueArchitectureBlocks].sort();
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
  });

  it('uniqueWorkshops is sorted ascending', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueWorkshops].sort();
    expect(s.uniqueWorkshops).toEqual(sorted);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizeHealthcareAiArchetypes();
    const b = summarizeHealthcareAiArchetypes();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · healthcare-ai-archetypes.ts
// ---------------------------------------------------------------------

describe('module hygiene · healthcare-ai-archetypes.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/healthcare-ai-archetypes.ts',
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

  it('does not invoke Anthropic / OpenAI / Supabase runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/supabase/i);
  });

  it('does not import auth / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/\/lib\/auth/);
    expect(codeOnly).not.toMatch(/\/lib\/source/);
    expect(codeOnly).not.toMatch(/\/lib\/sentinel/);
    expect(codeOnly).not.toMatch(/\/lib\/atlas/);
    expect(codeOnly).not.toMatch(/\/lib\/nexus/);
    expect(codeOnly).not.toMatch(/\/lib\/agent/);
  });

  it('does not import next/* or React', () => {
    expect(codeOnly).not.toMatch(/from 'next\//);
    expect(codeOnly).not.toMatch(/from "next\//);
    expect(codeOnly).not.toMatch(/from 'react'/);
    expect(codeOnly).not.toMatch(/from "react"/);
  });
});
