/**
 * Wave 30 PAT2 — Pattern Authoring Workflow
 *
 * Verifies the canonical pattern authoring lifecycle model:
 * - All 8 lifecycle stages present
 * - Stage advancement gates work correctly
 * - Helper functions return consistent results
 * - All blocking gates are present
 */

import {
  getPatternAuthoringWorkflow,
  getAuthoringStage,
  getAllBlockingGates,
  getRemainingStages,
  evaluateStageAdvancement,
  PATTERN_AUTHORING_STAGES_IN_ORDER,
} from '@/lib/solutions/pattern-authoring-workflow';

describe('PAT2 — getPatternAuthoringWorkflow()', () => {
  it('returns a workflow with stages array', () => {
    const workflow = getPatternAuthoringWorkflow();
    expect(workflow).toBeDefined();
    expect(Array.isArray(workflow.stages)).toBe(true);
  });

  it('workflow has exactly 8 stages', () => {
    const workflow = getPatternAuthoringWorkflow();
    expect(workflow.stages.length).toBe(8);
  });

  it('workflow has version "1.0"', () => {
    const workflow = getPatternAuthoringWorkflow();
    expect(workflow.version).toBe('1.0');
  });

  it('workflow has createdFrom sentinel', () => {
    const workflow = getPatternAuthoringWorkflow();
    expect(workflow.createdFrom).toBe('pat2_w30_pattern_authoring_workflow');
  });

  it('workflow has a name', () => {
    const workflow = getPatternAuthoringWorkflow();
    expect(typeof workflow.name).toBe('string');
    expect(workflow.name.length).toBeGreaterThan(0);
  });

  it('every stage has required fields', () => {
    const workflow = getPatternAuthoringWorkflow();
    for (const stage of workflow.stages) {
      expect(typeof stage.stage).toBe('string');
      expect(stage.stage.length).toBeGreaterThan(0);
      expect(typeof stage.label).toBe('string');
      expect(stage.label.length).toBeGreaterThan(0);
      expect(typeof stage.description).toBe('string');
      expect(stage.description.length).toBeGreaterThan(0);
      expect(Array.isArray(stage.requiredArtefacts)).toBe(true);
      expect(Array.isArray(stage.gates)).toBe(true);
    }
  });

  it('stages are in canonical order', () => {
    const workflow = getPatternAuthoringWorkflow();
    const stageIds = workflow.stages.map((s) => s.stage);
    expect(stageIds).toEqual(PATTERN_AUTHORING_STAGES_IN_ORDER);
  });

  it('last stage (deprecated) has nextStage: null', () => {
    const workflow = getPatternAuthoringWorkflow();
    const last = workflow.stages[workflow.stages.length - 1];
    expect(last.stage).toBe('deprecated');
    expect(last.nextStage).toBeNull();
  });
});

describe('PAT2 — Canonical stages present', () => {
  it('scoping stage is present', () => {
    const stage = getAuthoringStage('scoping');
    expect(stage).toBeDefined();
    expect(stage!.nextStage).toBe('criteria');
  });

  it('criteria stage has at least 2 required artefacts', () => {
    const stage = getAuthoringStage('criteria');
    expect(stage).toBeDefined();
    const required = stage!.requiredArtefacts.filter((a) => a.required);
    expect(required.length).toBeGreaterThanOrEqual(2);
  });

  it('review stage has test-coverage artefact', () => {
    const stage = getAuthoringStage('review');
    expect(stage).toBeDefined();
    const hasCoverage = stage!.requiredArtefacts.some((a) => a.artefactId === 'review-test-coverage');
    expect(hasCoverage).toBe(true);
  });

  it('validated stage requires engagement reference', () => {
    const stage = getAuthoringStage('validated');
    expect(stage).toBeDefined();
    const hasRef = stage!.requiredArtefacts.some((a) => a.artefactId === 'engagement-reference');
    expect(hasRef).toBe(true);
  });

  it('canonical stage has nextStage deprecated', () => {
    const stage = getAuthoringStage('canonical');
    expect(stage).toBeDefined();
    expect(stage!.nextStage).toBe('deprecated');
  });
});

describe('PAT2 — Gate structure', () => {
  it('every gate has required fields', () => {
    const workflow = getPatternAuthoringWorkflow();
    for (const stage of workflow.stages) {
      for (const gate of stage.gates) {
        expect(typeof gate.gateId).toBe('string');
        expect(gate.gateId.length).toBeGreaterThan(0);
        expect(typeof gate.description).toBe('string');
        expect(gate.description.length).toBeGreaterThan(0);
        expect(typeof gate.blocking).toBe('boolean');
      }
    }
  });

  it('all gateIds are unique across the workflow', () => {
    const workflow = getPatternAuthoringWorkflow();
    const ids: string[] = [];
    for (const stage of workflow.stages) {
      for (const gate of stage.gates) {
        ids.push(gate.gateId);
      }
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('PAT2 — getAllBlockingGates()', () => {
  it('returns an array', () => {
    const gates = getAllBlockingGates();
    expect(Array.isArray(gates)).toBe(true);
  });

  it('all returned gates have blocking: true', () => {
    const gates = getAllBlockingGates();
    expect(gates.every((g) => g.blocking)).toBe(true);
  });

  it('blocking gates are present in scoping stage', () => {
    const gates = getAllBlockingGates();
    const scopingGates = gates.filter((g) => g.stage === 'scoping');
    expect(scopingGates.length).toBeGreaterThan(0);
  });

  it('review stage has a readiness-gate blocking condition', () => {
    const gates = getAllBlockingGates();
    const reviewGates = gates.filter((g) => g.stage === 'review');
    const hasReadinessGate = reviewGates.some((g) => g.gateId === 'review-G1-readiness-gate');
    expect(hasReadinessGate).toBe(true);
  });

  it('each blocking gate has a stage property', () => {
    const gates = getAllBlockingGates();
    for (const g of gates) {
      expect(typeof g.stage).toBe('string');
    }
  });
});

describe('PAT2 — getRemainingStages()', () => {
  it('returns stages from scoping to end (8 stages)', () => {
    const remaining = getRemainingStages('scoping');
    expect(remaining.length).toBe(8);
    expect(remaining[0].stage).toBe('scoping');
  });

  it('returns stages from validated onwards', () => {
    const remaining = getRemainingStages('validated');
    expect(remaining.length).toBe(3); // validated, canonical, deprecated
    expect(remaining[0].stage).toBe('validated');
  });

  it('returns just deprecated for the final stage', () => {
    const remaining = getRemainingStages('deprecated');
    expect(remaining.length).toBe(1);
    expect(remaining[0].stage).toBe('deprecated');
  });

  it('returns empty array for unknown stage', () => {
    const remaining = getRemainingStages('unknown-stage' as never);
    expect(remaining).toEqual([]);
  });
});

describe('PAT2 — evaluateStageAdvancement()', () => {
  it('scoping stage can advance when all required artefacts provided', () => {
    const result = evaluateStageAdvancement('scoping', [
      'scope-domain',
      'scope-primary-question',
      'scope-categories',
      'scope-primary-agent',
    ]);
    expect(result.canAdvance).toBe(true);
    expect(result.nextStage).toBe('criteria');
    expect(result.missingArtefacts.length).toBe(0);
    expect(result.deterministicSeed).toBe(true);
  });

  it('scoping stage cannot advance when required artefact missing', () => {
    const result = evaluateStageAdvancement('scoping', [
      'scope-domain',
      'scope-primary-question',
      // missing scope-categories and scope-primary-agent
    ]);
    expect(result.canAdvance).toBe(false);
    expect(result.missingArtefacts).toContain('scope-categories');
    expect(result.missingArtefacts).toContain('scope-primary-agent');
  });

  it('result has deterministicSeed: true', () => {
    const result = evaluateStageAdvancement('criteria', ['criteria-list', 'criteria-severity-mix']);
    expect(result.deterministicSeed).toBe(true);
  });

  it('unknown stage returns canAdvance: false', () => {
    const result = evaluateStageAdvancement('unknown-stage' as never, []);
    expect(result.canAdvance).toBe(false);
    expect(result.nextStage).toBeNull();
  });

  it('deprecated stage has no required artefacts to provide (always can advance internally)', () => {
    // deprecated has 1 required artefact: deprecation-reason
    const resultWithout = evaluateStageAdvancement('deprecated', []);
    expect(resultWithout.canAdvance).toBe(false);
    expect(resultWithout.missingArtefacts).toContain('deprecation-reason');

    const resultWith = evaluateStageAdvancement('deprecated', ['deprecation-reason']);
    expect(resultWith.canAdvance).toBe(true);
  });
});

describe('PAT2 — Constants', () => {
  it('PATTERN_AUTHORING_STAGES_IN_ORDER has 8 entries', () => {
    expect(PATTERN_AUTHORING_STAGES_IN_ORDER.length).toBe(8);
  });

  it('first stage is scoping', () => {
    expect(PATTERN_AUTHORING_STAGES_IN_ORDER[0]).toBe('scoping');
  });

  it('last stage is deprecated', () => {
    expect(PATTERN_AUTHORING_STAGES_IN_ORDER[7]).toBe('deprecated');
  });

  it('validated comes before canonical', () => {
    const vi = PATTERN_AUTHORING_STAGES_IN_ORDER.indexOf('validated');
    const ci = PATTERN_AUTHORING_STAGES_IN_ORDER.indexOf('canonical');
    expect(vi).toBeLessThan(ci);
  });
});
