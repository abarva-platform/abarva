// sanitizeGenerationPlan — deterministic plan repair so the architect's invalid
// citations / ungrounded sections never hard-block a run (regression 2026-06-17).
import { sanitizeGenerationPlan } from '../generation-plan';
import { amsRfpRequest } from '../__fixtures__/ams-rfp';
import type { DeliverableGenerationPlan } from '../types';

function planWith(sections: DeliverableGenerationPlan['sectionPlan']): DeliverableGenerationPlan {
  return {
    sectionPlan: sections,
    evidenceMapping: [
      { citationNumber: 2, usedInSections: ['a'], supportsClaim: 'ok' },
      { citationNumber: 99, usedInSections: ['a'], supportsClaim: 'invalid' },
    ],
    missingEvidenceHandling: [],
    artifactEnhancementSuggestions: [],
    tableAndExhibitPlan: [],
    clientCompletePlan: [],
    outputPackagePlan: [],
  } as unknown as DeliverableGenerationPlan;
}

describe('sanitizeGenerationPlan', () => {
  // fixture bundle is citations [1]..[5]
  it('drops citations outside the evidence bundle', () => {
    const plan = planWith([
      { key: 'scope', title: 'Scope', groundingMode: 'mixed', evidenceCitations: [2, 17, 27], assumptionsUsed: [], placeholders: [], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    sanitizeGenerationPlan(plan, amsRfpRequest());
    expect(plan.sectionPlan[0]!.evidenceCitations).toEqual([2]);
  });

  it('downgrades a now-ungrounded governed_facts/mixed section to expert_template', () => {
    const plan = planWith([
      { key: 'risks', title: 'Risks', groundingMode: 'mixed', evidenceCitations: [17], assumptionsUsed: [], placeholders: [], rationale: '' },
      { key: 'rec', title: 'Recommendation', groundingMode: 'governed_facts', evidenceCitations: [], assumptionsUsed: [], placeholders: [], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    sanitizeGenerationPlan(plan, amsRfpRequest());
    expect(plan.sectionPlan[0]!.groundingMode).toBe('expert_template');
    expect(plan.sectionPlan[1]!.groundingMode).toBe('expert_template');
  });

  it('keeps a section grounded by a valid citation/placeholder/assumption as-is', () => {
    const plan = planWith([
      { key: 'a', title: 'A', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
      { key: 'b', title: 'B', groundingMode: 'governed_facts', evidenceCitations: [99], assumptionsUsed: [], placeholders: ['CLIENT TO COMPLETE'], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    sanitizeGenerationPlan(plan, amsRfpRequest());
    expect(plan.sectionPlan[0]!.groundingMode).toBe('mixed');
    expect(plan.sectionPlan[1]!.groundingMode).toBe('governed_facts'); // kept via placeholder
  });

  it('drops invalid citationNumbers from evidenceMapping', () => {
    const plan = planWith([
      { key: 'a', title: 'A', groundingMode: 'expert_template', evidenceCitations: [], assumptionsUsed: [], placeholders: [], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    sanitizeGenerationPlan(plan, amsRfpRequest());
    expect(plan.evidenceMapping.map((m) => m.citationNumber)).toEqual([2]);
  });
});
