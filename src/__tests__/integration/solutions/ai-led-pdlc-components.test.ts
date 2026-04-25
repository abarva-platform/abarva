// SOL2 · AI-led PDLC Solution Component Pack tests.

import {
  AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER,
  getAiLedPdlcSolutionComponent,
  listAiLedPdlcSolutionComponents,
  recommendPdlcComponentsFromInputs,
  summarizePdlcSolutionComponentPack,
  type AiLedPdlcComponentKey,
} from '@/lib/solutions/ai-led-pdlc-components';
import { AI_PROGRAM_FAILURE_KEYS_IN_ORDER } from '@/lib/intelligence/ai-program-failure-modes';

const SENTINEL_PATTERN_KEYS = [
  'value_ledger_incompleteness',
  'evidence_chain_gap',
  'gate_governance_gap',
  'program_context_sparsity',
  'ai_governance_operating_model_gap',
] as const;

const PF1_KEY_SET = new Set<string>(AI_PROGRAM_FAILURE_KEYS_IN_ORDER as ReadonlyArray<string>);
const I1_KEY_SET = new Set<string>(SENTINEL_PATTERN_KEYS as ReadonlyArray<string>);

const DOLLAR_PATTERN = /\$\s?\d/;

// ---------------------------------------------------------------------
// All components present + canonical order
// ---------------------------------------------------------------------

describe('listAiLedPdlcSolutionComponents', () => {
  it('returns exactly the 14 canonical components in canonical order', () => {
    const components = listAiLedPdlcSolutionComponents();
    expect(components.length).toBe(14);
    const expected: AiLedPdlcComponentKey[] = [
      'context_as_code_foundation',
      'ai_assisted_requirements',
      'spec_to_code_workflow',
      'ai_code_review',
      'ai_test_generation',
      'secure_coding_guardrails',
      'architecture_decision_records',
      'developer_knowledge_graph',
      'dora_telemetry_layer',
      'ai_adoption_measurement',
      'human_in_loop_approval',
      'release_risk_intelligence',
      'engineering_coach_agent',
      'value_ledger_for_pdlc',
    ];
    expect(components.map((c) => c.key)).toEqual(expected);
    expect(AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER).toEqual(expected);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = listAiLedPdlcSolutionComponents();
    const b = listAiLedPdlcSolutionComponents();
    expect(a).toEqual(b);
  });

  it('serializes byte-equal across repeated calls', () => {
    const a = JSON.stringify(listAiLedPdlcSolutionComponents());
    const b = JSON.stringify(listAiLedPdlcSolutionComponents());
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------
// Field set per component
// ---------------------------------------------------------------------

describe('every component carries the required field set', () => {
  it.each(AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER.map((k) => [k]))(
    '%s has full schema and meets array minimums',
    (k) => {
      const c = getAiLedPdlcSolutionComponent(k as string);
      expect(c).not.toBeNull();
      const comp = c!;
      expect(comp.key).toBe(k);
      expect(comp.name.length).toBeGreaterThan(0);
      expect(comp.definition.length).toBeGreaterThan(0);
      expect(comp.problemSolved.length).toBeGreaterThan(0);
      expect(comp.requiredCurrentStateInputs.length).toBeGreaterThanOrEqual(3);
      expect(comp.requiredMetrics.length).toBeGreaterThanOrEqual(2);
      expect(comp.targetCapabilities.length).toBeGreaterThanOrEqual(2);
      expect(comp.enablingTools.length).toBeGreaterThanOrEqual(2);
      expect(comp.governanceRequirements.length).toBeGreaterThanOrEqual(2);
      expect(comp.implementationSteps.length).toBeGreaterThanOrEqual(3);
      expect(comp.expectedOutcomes.length).toBeGreaterThanOrEqual(2);
      expect(comp.risks.length).toBeGreaterThanOrEqual(1);
      expect(comp.relatedFailureModes.length).toBeGreaterThanOrEqual(1);
      expect(comp.relatedPatterns.length).toBeGreaterThanOrEqual(1);
      expect(comp.requiredWorkshops.length).toBeGreaterThanOrEqual(1);
      expect(comp.deliverablesProduced.length).toBeGreaterThanOrEqual(1);
      expect(comp.createdFrom).toBe('deterministic_solution_component_pack');
    },
  );

  it('every required string field is non-empty after trim', () => {
    for (const c of listAiLedPdlcSolutionComponents()) {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.definition.trim().length).toBeGreaterThan(0);
      expect(c.problemSolved.trim().length).toBeGreaterThan(0);
      const arrays: ReadonlyArray<ReadonlyArray<string>> = [
        c.requiredCurrentStateInputs,
        c.requiredMetrics,
        c.targetCapabilities,
        c.enablingTools,
        c.governanceRequirements,
        c.implementationSteps,
        c.expectedOutcomes,
        c.risks,
        c.relatedFailureModes,
        c.relatedPatterns,
        c.requiredWorkshops,
        c.deliverablesProduced,
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
// Cross-reference: PF1 + I1 keys
// ---------------------------------------------------------------------

describe('cross-reference to PF1 + I1 canonical keys', () => {
  it('every relatedFailureModes entry is a canonical PF1 key', () => {
    for (const c of listAiLedPdlcSolutionComponents()) {
      for (const fm of c.relatedFailureModes) {
        expect(PF1_KEY_SET.has(fm)).toBe(true);
      }
    }
  });

  it('every relatedPatterns entry is a canonical I1 key', () => {
    for (const c of listAiLedPdlcSolutionComponents()) {
      for (const pk of c.relatedPatterns) {
        expect(I1_KEY_SET.has(pk)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// DORA metric coverage
// ---------------------------------------------------------------------

describe('DORA metric coverage', () => {
  it('the dora_telemetry_layer requiredMetrics names all four canonical DORA metrics', () => {
    const dora = getAiLedPdlcSolutionComponent('dora_telemetry_layer');
    expect(dora).not.toBeNull();
    const text = dora!.requiredMetrics.join(' | ').toLowerCase();
    expect(text).toContain('lead time');
    expect(text).toContain('deployment frequency');
    expect(text).toContain('change-failure rate');
    expect(text).toContain('mean time to recovery');
  });

  it('at least eight components reference at least one DORA metric in requiredMetrics', () => {
    const doraTokens = [
      'lead time',
      'deployment frequency',
      'change-failure rate',
      'mean time to recovery',
    ];
    let count = 0;
    for (const c of listAiLedPdlcSolutionComponents()) {
      const text = c.requiredMetrics.join(' | ').toLowerCase();
      if (doraTokens.some((t) => text.includes(t))) count += 1;
    }
    expect(count).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getAiLedPdlcSolutionComponent', () => {
  it('returns null for unknown keys', () => {
    expect(getAiLedPdlcSolutionComponent('not-a-real-component')).toBeNull();
    expect(getAiLedPdlcSolutionComponent('')).toBeNull();
    expect(getAiLedPdlcSolutionComponent('weak_data_foundation')).toBeNull();
    expect(getAiLedPdlcSolutionComponent('value_ledger_incompleteness')).toBeNull();
  });

  it('returns the canonical record for every key', () => {
    for (const k of AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER) {
      const c = getAiLedPdlcSolutionComponent(k);
      expect(c).not.toBeNull();
      expect(c!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Recommend from inputs
// ---------------------------------------------------------------------

describe('recommendPdlcComponentsFromInputs', () => {
  it('returns empty when no failureModes or patternKeys are supplied', () => {
    expect(recommendPdlcComponentsFromInputs({})).toEqual([]);
    expect(recommendPdlcComponentsFromInputs({ currentStateNotes: ['anything'] })).toEqual([]);
    expect(
      recommendPdlcComponentsFromInputs({ failureModes: [], patternKeys: [] }),
    ).toEqual([]);
  });

  it('matches by failure-mode overlap', () => {
    const matched = recommendPdlcComponentsFromInputs({
      failureModes: ['no_value_ledger'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('value_ledger_for_pdlc');
  });

  it('matches by pattern-key overlap', () => {
    const matched = recommendPdlcComponentsFromInputs({
      patternKeys: ['value_ledger_incompleteness'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('value_ledger_for_pdlc');
    expect(matched.map((m) => m.key)).toContain('dora_telemetry_layer');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendPdlcComponentsFromInputs({
      failureModes: ['no_measurable_baseline', 'no_value_ledger'],
      patternKeys: ['evidence_chain_gap', 'value_ledger_incompleteness'],
    });
    const b = recommendPdlcComponentsFromInputs({
      failureModes: ['no_value_ledger', 'no_measurable_baseline'],
      patternKeys: ['value_ledger_incompleteness', 'evidence_chain_gap'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));
    // Canonical order means the matched key sequence is a subsequence of the canonical order.
    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) =>
      AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER.indexOf(k),
    );
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('ignores unknown failure-mode and pattern keys without throwing', () => {
    const matched = recommendPdlcComponentsFromInputs({
      failureModes: ['definitely_not_a_failure_mode'],
      patternKeys: ['definitely_not_a_pattern'],
    });
    expect(matched).toEqual([]);
  });

  it('union semantics: a component matched by failureMode or by pattern appears once', () => {
    const matched = recommendPdlcComponentsFromInputs({
      failureModes: ['no_value_ledger'],
      patternKeys: ['value_ledger_incompleteness'],
    });
    const keys = matched.map((c) => c.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
    expect(keys).toContain('value_ledger_for_pdlc');
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      failureModes: ['missing_governance_risk'],
      patternKeys: ['gate_governance_gap'],
    };
    const a = recommendPdlcComponentsFromInputs(input);
    const b = recommendPdlcComponentsFromInputs(input);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizePdlcSolutionComponentPack', () => {
  it('totalCount equals the canonical pack size', () => {
    const s = summarizePdlcSolutionComponentPack();
    expect(s.totalCount).toBe(AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER.length);
  });

  it('byRequiredWorkshopCount sums to the total of required-workshops across the pack', () => {
    const s = summarizePdlcSolutionComponentPack();
    const totalWorkshopRefs = listAiLedPdlcSolutionComponents().reduce(
      (acc, c) => acc + c.requiredWorkshops.length,
      0,
    );
    const sumCounts = Object.values(s.byRequiredWorkshopCount).reduce((a, b) => a + b, 0);
    expect(sumCounts).toBe(totalWorkshopRefs);
  });

  it('uniqueRelatedFailureModes is sorted and contains only canonical PF1 keys', () => {
    const s = summarizePdlcSolutionComponentPack();
    const sorted = [...s.uniqueRelatedFailureModes].sort();
    expect(s.uniqueRelatedFailureModes).toEqual(sorted);
    for (const fm of s.uniqueRelatedFailureModes) {
      expect(PF1_KEY_SET.has(fm)).toBe(true);
    }
  });

  it('uniqueRelatedPatterns is sorted and contains only canonical I1 keys', () => {
    const s = summarizePdlcSolutionComponentPack();
    const sorted = [...s.uniqueRelatedPatterns].sort();
    expect(s.uniqueRelatedPatterns).toEqual(sorted);
    for (const pk of s.uniqueRelatedPatterns) {
      expect(I1_KEY_SET.has(pk)).toBe(true);
    }
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizePdlcSolutionComponentPack();
    const b = summarizePdlcSolutionComponentPack();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no component invents a dollar amount in any string field', () => {
    for (const c of listAiLedPdlcSolutionComponents()) {
      const stringFields: string[] = [
        c.name,
        c.definition,
        c.problemSolved,
        ...c.requiredCurrentStateInputs,
        ...c.requiredMetrics,
        ...c.targetCapabilities,
        ...c.enablingTools,
        ...c.governanceRequirements,
        ...c.implementationSteps,
        ...c.expectedOutcomes,
        ...c.risks,
        ...c.requiredWorkshops,
        ...c.deliverablesProduced,
      ];
      for (const f of stringFields) {
        expect(f).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('every component is tagged createdFrom: deterministic_solution_component_pack', () => {
    for (const c of listAiLedPdlcSolutionComponents()) {
      expect(c.createdFrom).toBe('deterministic_solution_component_pack');
    }
  });

  it('no component string field claims live retrieval / live model invocation', () => {
    const livePatterns = [/live model invocation/i, /real-?time retrieval/i, /live anthropic/i, /live openai/i];
    for (const c of listAiLedPdlcSolutionComponents()) {
      const text = [
        c.name,
        c.definition,
        c.problemSolved,
        ...c.requiredCurrentStateInputs,
        ...c.requiredMetrics,
        ...c.targetCapabilities,
        ...c.enablingTools,
        ...c.governanceRequirements,
        ...c.implementationSteps,
        ...c.expectedOutcomes,
        ...c.risks,
        ...c.requiredWorkshops,
        ...c.deliverablesProduced,
      ].join(' | ');
      for (const p of livePatterns) {
        expect(text).not.toMatch(p);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · ai-led-pdlc-components.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/ai-led-pdlc-components.ts',
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
});
