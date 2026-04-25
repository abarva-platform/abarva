// SOL5 · Healthcare AI Archetype Pack tests.

import {
  HEALTHCARE_AI_ARCHETYPE_KEYS,
  HEALTHCARE_AI_ARCHETYPES,
  getHealthcareAiArchetype,
  listHealthcareAiArchetypes,
  recommendHealthcareAiArchetypes,
  summarizeHealthcareAiArchetypes,
  type HealthcareAiArchetypeKey,
} from '@/lib/solutions/healthcare-ai-archetypes';

const VENDOR_DENY_LIST: ReadonlyArray<string> = [
  'Suki',
  'Nuance DAX',
  'Abridge',
  'Epic-specific endorsement',
];

const DOLLAR_PATTERN = /\$\s?\d/;

function joinAllStrings(a: {
  name: string;
  clinicalBusinessProblem: string;
  workflowImpacted: ReadonlyArray<string>;
  currentStateInputsRequired: ReadonlyArray<string>;
  dataSourcesRequired: ReadonlyArray<string>;
  architectureBuildingBlocks: ReadonlyArray<string>;
  vendorStartupConsiderations: ReadonlyArray<string>;
  buildBuyPartnerConsiderations: ReadonlyArray<string>;
  governanceRiskConsiderations: ReadonlyArray<string>;
  valueMetrics: ReadonlyArray<string>;
  requiredWorkshops: ReadonlyArray<string>;
  smesRequired: ReadonlyArray<string>;
  deliverablesGenerated: ReadonlyArray<string>;
  patternsUsed: ReadonlyArray<string>;
  failureModesAddressed: ReadonlyArray<string>;
  likelySystemsImpacted: ReadonlyArray<string>;
}): string {
  return [
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
    ...a.failureModesAddressed,
    ...a.likelySystemsImpacted,
  ].join(' | ');
}

// ---------------------------------------------------------------------
// All archetypes present + canonical order
// ---------------------------------------------------------------------

describe('listHealthcareAiArchetypes', () => {
  it('returns exactly the 12 canonical archetypes in canonical order', () => {
    const archetypes = listHealthcareAiArchetypes();
    expect(archetypes.length).toBe(12);
    const expected: HealthcareAiArchetypeKey[] = [
      'ambient_clinical_value_chain',
      'hcc_risk_adjustment_coding_accuracy',
      'prior_authorization_automation',
      'clinical_documentation_improvement',
      'care_management_next_best_action',
      'patient_access_scheduling_optimization',
      'revenue_integrity_ai',
      'population_health_analytics',
      'clinical_contact_center_ai',
      'provider_network_intelligence',
      'denial_prevention_ai',
      'patient_experience_personalization',
    ];
    expect(archetypes.map((a) => a.key)).toEqual(expected);
    expect(HEALTHCARE_AI_ARCHETYPE_KEYS).toEqual(expected);
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

  it('exposes the canonical record map keyed identically', () => {
    for (const k of HEALTHCARE_AI_ARCHETYPE_KEYS) {
      const a = HEALTHCARE_AI_ARCHETYPES[k];
      expect(a).toBeDefined();
      expect(a.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Field set per archetype
// ---------------------------------------------------------------------

describe('every archetype carries the required field set', () => {
  it.each(HEALTHCARE_AI_ARCHETYPE_KEYS.map((k) => [k]))(
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
      expect(arch.failureModesAddressed.length).toBeGreaterThanOrEqual(1);
      expect(arch.likelySystemsImpacted.length).toBeGreaterThanOrEqual(2);
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
        a.failureModesAddressed,
        a.likelySystemsImpacted,
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
// Specific content requirements
// ---------------------------------------------------------------------

describe('ambient clinical value chain — downstream workflow coverage', () => {
  it('workflowImpacted names downstream coding, billing, and quality entries', () => {
    const arch = getHealthcareAiArchetype('ambient_clinical_value_chain');
    expect(arch).not.toBeNull();
    const wf = arch!.workflowImpacted.join(' | ').toLowerCase();
    expect(wf).toContain('coding');
    expect(wf).toContain('billing');
    expect(wf).toContain('quality');
  });
});

describe('HCC risk adjustment — RAF / submission / audit coverage', () => {
  it('workflowImpacted mentions RAF, submission, and audit', () => {
    const arch = getHealthcareAiArchetype('hcc_risk_adjustment_coding_accuracy');
    expect(arch).not.toBeNull();
    const wf = arch!.workflowImpacted.join(' | ');
    expect(wf).toContain('RAF');
    expect(wf.toLowerCase()).toContain('submission');
    expect(wf.toLowerCase()).toContain('audit');
  });
});

describe('prior authorization — evidence packet / clinical policy / payer workflow', () => {
  it('joined string fields contain evidence packet, clinical policy, and payer workflow', () => {
    const arch = getHealthcareAiArchetype('prior_authorization_automation');
    expect(arch).not.toBeNull();
    const joined = joinAllStrings(arch!).toLowerCase();
    expect(joined).toContain('evidence packet');
    expect(joined).toContain('clinical policy');
    expect(joined).toContain('payer workflow');
  });
});

describe('revenue integrity AI vs denial prevention AI — distinctness', () => {
  it('clinical business problem statements are distinct', () => {
    const ri = getHealthcareAiArchetype('revenue_integrity_ai');
    const dp = getHealthcareAiArchetype('denial_prevention_ai');
    expect(ri).not.toBeNull();
    expect(dp).not.toBeNull();
    expect(ri!.clinicalBusinessProblem).not.toBe(dp!.clinicalBusinessProblem);
  });

  it('value metrics do not overlap entirely', () => {
    const ri = getHealthcareAiArchetype('revenue_integrity_ai');
    const dp = getHealthcareAiArchetype('denial_prevention_ai');
    const riSet = new Set(ri!.valueMetrics);
    const dpSet = new Set(dp!.valueMetrics);
    const intersection = [...riSet].filter((m) => dpSet.has(m));
    // Distinct: at least one value metric in each that the other does not carry.
    const riOnly = [...riSet].filter((m) => !dpSet.has(m));
    const dpOnly = [...dpSet].filter((m) => !riSet.has(m));
    expect(riOnly.length).toBeGreaterThan(0);
    expect(dpOnly.length).toBeGreaterThan(0);
    // And the intersection cannot be the entire set on either side.
    expect(intersection.length).toBeLessThan(riSet.size);
    expect(intersection.length).toBeLessThan(dpSet.size);
  });
});

// ---------------------------------------------------------------------
// Vendor deny-list (no branded endorsements)
// ---------------------------------------------------------------------

describe('vendor deny-list — no branded endorsements anywhere in any archetype', () => {
  it.each(VENDOR_DENY_LIST.map((v) => [v]))(
    'no archetype string field contains the substring "%s"',
    (denied) => {
      for (const a of listHealthcareAiArchetypes()) {
        const text = joinAllStrings(a);
        expect(text).not.toContain(denied);
      }
    },
  );

  it('vendorStartupConsiderations entries describe categories not branded vendors', () => {
    for (const a of listHealthcareAiArchetypes()) {
      for (const v of a.vendorStartupConsiderations) {
        for (const denied of VENDOR_DENY_LIST) {
          expect(v).not.toContain(denied);
        }
      }
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
    expect(getHealthcareAiArchetype('value_ledger_incompleteness')).toBeNull();
    expect(getHealthcareAiArchetype('weak_data_foundation')).toBeNull();
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
// Recommend from inputs
// ---------------------------------------------------------------------

describe('recommendHealthcareAiArchetypes', () => {
  it('returns empty when no keywords are supplied', () => {
    expect(recommendHealthcareAiArchetypes({})).toEqual([]);
    expect(
      recommendHealthcareAiArchetypes({ workflowKeywords: [], valueDriverKeywords: [] }),
    ).toEqual([]);
  });

  it('matches by workflow keyword overlap', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['scheduling'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('patient_access_scheduling_optimization');
  });

  it('matches by value-driver keyword overlap', () => {
    const matched = recommendHealthcareAiArchetypes({
      valueDriverKeywords: ['denial'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('denial_prevention_ai');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendHealthcareAiArchetypes({
      workflowKeywords: ['coding', 'documentation'],
      valueDriverKeywords: ['adherence', 'engagement'],
    });
    const b = recommendHealthcareAiArchetypes({
      workflowKeywords: ['documentation', 'coding'],
      valueDriverKeywords: ['engagement', 'adherence'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));
    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) =>
      HEALTHCARE_AI_ARCHETYPE_KEYS.indexOf(k),
    );
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('ignores unknown / empty keywords without throwing', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['definitely-not-a-real-workflow-keyword'],
      valueDriverKeywords: ['definitely-not-a-real-value-keyword'],
    });
    expect(matched).toEqual([]);
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      workflowKeywords: ['triage'],
      valueDriverKeywords: ['rate'],
    };
    const a = recommendHealthcareAiArchetypes(input);
    const b = recommendHealthcareAiArchetypes(input);
    expect(a).toEqual(b);
  });

  it('union semantics: a single archetype matched by both workflow and value keyword appears once', () => {
    const matched = recommendHealthcareAiArchetypes({
      workflowKeywords: ['denial'],
      valueDriverKeywords: ['denial'],
    });
    const keys = matched.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeHealthcareAiArchetypes', () => {
  it('totalCount equals the canonical pack size of 12', () => {
    const s = summarizeHealthcareAiArchetypes();
    expect(s.totalCount).toBe(12);
    expect(s.totalCount).toBe(HEALTHCARE_AI_ARCHETYPE_KEYS.length);
  });

  it('uniqueWorkflows is sorted ascending and de-duplicated', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueWorkflows].sort();
    expect(s.uniqueWorkflows).toEqual(sorted);
    expect(new Set(s.uniqueWorkflows).size).toBe(s.uniqueWorkflows.length);
  });

  it('uniqueArchitectureBlocks is sorted ascending and de-duplicated', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueArchitectureBlocks].sort();
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
    expect(new Set(s.uniqueArchitectureBlocks).size).toBe(s.uniqueArchitectureBlocks.length);
  });

  it('uniqueWorkshops is sorted ascending and de-duplicated', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueWorkshops].sort();
    expect(s.uniqueWorkshops).toEqual(sorted);
    expect(new Set(s.uniqueWorkshops).size).toBe(s.uniqueWorkshops.length);
  });

  it('uniqueDataSources is sorted ascending and de-duplicated', () => {
    const s = summarizeHealthcareAiArchetypes();
    const sorted = [...s.uniqueDataSources].sort();
    expect(s.uniqueDataSources).toEqual(sorted);
    expect(new Set(s.uniqueDataSources).size).toBe(s.uniqueDataSources.length);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizeHealthcareAiArchetypes();
    const b = summarizeHealthcareAiArchetypes();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no archetype invents a dollar amount in any string field', () => {
    for (const a of listHealthcareAiArchetypes()) {
      const text = joinAllStrings(a);
      expect(text).not.toMatch(DOLLAR_PATTERN);
    }
  });

  it('every archetype is tagged createdFrom: deterministic_healthcare_archetype_pack', () => {
    for (const a of listHealthcareAiArchetypes()) {
      expect(a.createdFrom).toBe('deterministic_healthcare_archetype_pack');
    }
  });

  it('no archetype string field claims live retrieval / live model invocation', () => {
    const livePatterns = [/live model invocation/i, /real-?time retrieval/i, /live anthropic/i, /live openai/i];
    for (const a of listHealthcareAiArchetypes()) {
      const text = joinAllStrings(a);
      for (const p of livePatterns) {
        expect(text).not.toMatch(p);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
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

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not contain forbidden filler phrases', () => {
    expect(codeOnly.toLowerCase()).not.toContain('coming soon');
    expect(codeOnly.toLowerCase()).not.toContain('tbd');
    expect(codeOnly.toLowerCase()).not.toContain('lorem ipsum');
  });
});
