// sanitizeGenerationPlan — deterministic plan repair so the architect's invalid
// citations / ungrounded sections never hard-block a run (regression 2026-06-17).
import { sanitizeGenerationPlan } from '../generation-plan';
import { amsRfpRequest } from '../__fixtures__/ams-rfp';
import { getArtifactBrief } from '../artifact-brief-registry';
import { getDeliverableStructure } from '../briefs/deliverable-structures';
import type { DeliverableArtifactBrief, DeliverableGenerationPlan } from '../types';

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

  it('drops forbidden later-phase sections but keeps the decision-sections', () => {
    const brief = {
      forbiddenSectionTopics: ['current state', 'target state', 'solution design'],
    } as DeliverableArtifactBrief;
    const plan = planWith([
      { key: 'exec_summary', title: 'Executive Summary', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
      { key: 'current_state', title: 'Current-State Evidence', groundingMode: 'governed_facts', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
      { key: 'target_arch', title: 'Target State Architecture', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
      { key: 'value_hypothesis', title: 'Value Hypothesis', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    plan.tableAndExhibitPlan = [
      { key: 'target_state_diagram', title: 'Target State Architecture', kind: 'exhibit', targetFormat: 'docx', groundingMode: 'mixed' },
      { key: 'risk_register', title: 'Risk / Issues / Dependencies', kind: 'table', targetFormat: 'docx', groundingMode: 'mixed' },
    ] as DeliverableGenerationPlan['tableAndExhibitPlan'];
    sanitizeGenerationPlan(plan, amsRfpRequest(), brief);
    expect(plan.sectionPlan.map((s) => s.key)).toEqual(['exec_summary', 'value_hypothesis']);
    expect(plan.tableAndExhibitPlan.map((t) => t.key)).toEqual(['risk_register']);
  });

  it('is a no-op for forbidden topics when the brief omits them', () => {
    const plan = planWith([
      { key: 'current_state', title: 'Current-State Evidence', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: '' },
    ] as DeliverableGenerationPlan['sectionPlan']);
    sanitizeGenerationPlan(plan, amsRfpRequest());
    expect(plan.sectionPlan.map((s) => s.key)).toEqual(['current_state']);
  });
});

describe('MOVES_CHARTER structure (phase discipline)', () => {
  it('no longer carries a current-state evidence analysis section', () => {
    const structure = getDeliverableStructure('moves', 'charter')!;
    expect(structure).toBeTruthy();
    expect(structure.sections.map((s) => s.key)).not.toContain('current_state');
    expect(structure.requiredSectionKeys).not.toContain('current_state');
    // decision/commitment sections are present
    for (const k of ['sponsor_commitment', 'success_criteria', 'kill_criterion']) {
      expect(structure.sections.map((s) => s.key)).toContain(k);
    }
    expect((structure.forbiddenSectionTopics ?? []).join(' ')).toMatch(/target state/i);
  });

  it('requires the four-part success-criteria model and change-ready sponsorship', () => {
    const structure = getDeliverableStructure('moves', 'charter')!;
    const sc = structure.sections.find((s) => s.key === 'success_criteria')!;
    expect(sc).toBeTruthy();
    expect(structure.requiredSectionKeys).toContain('success_criteria');
    // outcomes + metrics + post-deployment measurement + business-process change
    expect(sc.intent).toMatch(/outcome/i);
    expect(sc.intent).toMatch(/baseline/i);
    expect(sc.intent).toMatch(/measure(d|ment)? after|after.*deploy|post-go-live|post-deployment/i);
    expect(sc.intent).toMatch(/process.?change|business-process/i);
    // sponsor commitment carries change readiness + commitment to drive process change
    const sponsor = structure.sections.find((s) => s.key === 'sponsor_commitment')!;
    expect(sponsor.intent).toMatch(/change readiness|drive the business-process|process change/i);
  });

  it('surfaces the forbidden topics on the composed charter brief', () => {
    const brief = getArtifactBrief({
      module: 'moves',
      useCaseArchetype: 'ai_program',
      deliverableType: 'charter',
      audience: ['sponsor'],
      decisionContext: 'charter the move',
      governedEvidenceBundle: [],
      missingEvidence: [],
      clientCompleteItems: [],
      outputFormats: ['docx'],
    } as unknown as Parameters<typeof getArtifactBrief>[0]);
    expect(brief.forbiddenSectionTopics ?? []).toContain('current state');
    expect(brief.requiredSections).not.toContain('current_state');
  });
});
