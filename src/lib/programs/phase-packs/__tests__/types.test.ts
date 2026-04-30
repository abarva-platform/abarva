// PhaseStep type contract · OV2-5-types
//
// Locks in the new PhaseStep doctrine from
// docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Part C.4 at the
// type level. This slice is type-only — packs do not yet declare `steps`.
// These tests verify:
//   • All 7 authored packs (P0-P6) still satisfy the PhasePack contract.
//   • A representative PhaseStep literal is well-typed under the new shape.
//   • The optional `steps` field accepts both undefined and an array.

import { listAuthoredPhases, getPhasePack } from '../index';
import type {
  PhasePack,
  PhaseStep,
  StepComplexity,
  AgentStepRole,
} from '../types';

describe('PhasePack · OV2-5-types compatibility', () => {
  it('every authored pack still satisfies the PhasePack contract', () => {
    const phases = listAuthoredPhases();
    expect(phases).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const p of phases) {
      const pack: PhasePack | null = getPhasePack(p);
      expect(pack).not.toBeNull();
      // Existing required fields still present.
      expect(typeof pack!.phase).toBe('number');
      expect(typeof pack!.label).toBe('string');
      expect(typeof pack!.outcome).toBe('string');
      expect(Array.isArray(pack!.definitionOfDone)).toBe(true);
      expect(Array.isArray(pack!.antiPatterns)).toBe(true);
    }
  });

  it('packs without authored steps have steps === undefined (P2-P6 until later slices)', () => {
    // OV2-P0-complete authored steps for P0; OV2-5-P1 authored steps for P1.
    // P2-P6 remain unauthored until OV2-5-P2..OV2-5-P6.
    const PHASES_WITH_STEPS = new Set([0, 1]);
    for (const p of listAuthoredPhases()) {
      const pack = getPhasePack(p);
      if (PHASES_WITH_STEPS.has(p)) {
        expect(Array.isArray(pack!.steps)).toBe(true);
      } else {
        expect(pack!.steps).toBeUndefined();
      }
    }
  });
});

describe('PhaseStep literal · OV2-5-types contract', () => {
  it('a simple step literal is well-typed', () => {
    const step: PhaseStep = {
      id: 'name-sponsor',
      label: 'Name the executive sponsor',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: ['sponsor_candidate'],
      outputs: ['sponsor_named'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    };
    expect(step.complexity).toBe('simple');
    expect(step.agentRole).toBe('extract');
    expect(step.preventsFailureModes).toEqual([1]);
  });

  it('a complex step literal is well-typed', () => {
    const step: PhaseStep = {
      id: 'run-discovery-workshop',
      label: 'Run cross-functional discovery workshop',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['workshop_intent', 'attendee_list'],
      outputs: ['discovery_workshop_notes', 'workshop_outcomes_summary'],
      templateRefs: ['discovery-workshop-facilitator-guide'],
      preventsFailureModes: [3, 7],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    };
    expect(step.complexity).toBe('complex');
    expect(step.intentCaptureRequired).toBe(true);
    expect(step.postMeetingUploadExpected).toBe(true);
  });

  it('StepComplexity admits only the documented values', () => {
    const a: StepComplexity = 'simple';
    const b: StepComplexity = 'complex';
    expect([a, b]).toEqual(['simple', 'complex']);
  });

  it('AgentStepRole admits each documented role', () => {
    const roles: AgentStepRole[] = [
      'extract',
      'validate',
      'coach_workshop',
      'coach_interview',
      'coach_baseline',
      'evaluate_evidence',
      'request_approval',
      'flag_anti_pattern',
      'compose_artifact',
    ];
    expect(roles).toHaveLength(9);
    // Spot-check one of each as assignable.
    const r1: AgentStepRole = 'extract';
    const r2: AgentStepRole = 'compose_artifact';
    expect(r1).toBe('extract');
    expect(r2).toBe('compose_artifact');
  });
});

describe('PhasePack.steps · optional field', () => {
  it('accepts a PhasePack literal with steps undefined', () => {
    // Build a minimal pack-shaped literal using one of the real packs as the
    // base so we exercise the type without modifying authored content.
    const base = getPhasePack(2)!;
    const withoutSteps: PhasePack = { ...base };
    expect(withoutSteps.steps).toBeUndefined();
  });

  it('accepts a PhasePack literal with steps as an array', () => {
    const base = getPhasePack(2)!;
    const step: PhaseStep = {
      id: 'compose-charter-draft',
      label: 'Compose the charter draft',
      complexity: 'simple',
      agentRole: 'compose_artifact',
      inputs: ['synthesis_outputs'],
      outputs: ['charter_draft'],
      templateRefs: ['charter-template-v1'],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    };
    const withSteps: PhasePack = { ...base, steps: [step] };
    expect(withSteps.steps).toHaveLength(1);
    expect(withSteps.steps?.[0]?.id).toBe('compose-charter-draft');
  });
});
