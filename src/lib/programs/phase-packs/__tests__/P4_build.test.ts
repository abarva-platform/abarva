// P4 Build · OV2-5-P4 tests
//
// Locks in the 8-step decomposition added by slice OV2-5-P4. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.4.4 — the
//     canonical P4 step list (complex: execution-plan, build-execution
//     [encoded as build-monitoring], pilot-launch, scale-validation, change-
//     readiness, pilot-result-interpretation; simple: execution-plan-drafted
//     [encoded as handoff-ingest in slice spec], go-no-go).
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.4.1 —
//     failures prevented by P4 (#5 workflow / operating-model change,
//     #8 pilot-to-production scaling gap, #3 operational data foundation).
//   • src/lib/programs/governance.ts — P4→P5 gate rule: design_approved
//     (hard), vendor_selection_approved (soft), execution_plan_drafted (soft).

import { P4_BUILD } from '../P4_build';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P4_STEP_IDS = [
  'p4-handoff-ingest',
  'p4-execution-plan-workshop',
  'p4-build-monitoring',
  'p4-pilot-launch',
  'p4-scale-validation-workshop',
  'p4-change-readiness-workshop',
  'p4-pilot-result-interpretation',
  'p4-go-no-go-call',
] as const;

describe('P4 Build · PhasePack contract still satisfied', () => {
  it('P4_BUILD conforms to PhasePack', () => {
    const pack: PhasePack = P4_BUILD;
    expect(pack.phase).toBe(4);
    expect(pack.label).toBe('P4 Build');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P4 Build · 8-step decomposition (D.4.4)', () => {
  it('declares exactly 8 steps with the canonical ids in order', () => {
    expect(P4_BUILD.steps).toBeDefined();
    expect(P4_BUILD.steps).toHaveLength(8);
    const ids = (P4_BUILD.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P4_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or are empty for intermediate artifacts)", () => {
    const dodIds = new Set(P4_BUILD.definitionOfDone.map((d) => d.id));
    const steps = P4_BUILD.steps ?? [];
    for (const s of steps) {
      // Empty arrays are allowed (intermediate-artifact producers). If any
      // output id is present, it MUST match a real DoD id (no invented ids).
      for (const out of s.outputs) {
        expect(dodIds.has(out)).toBe(true);
      }
    }
  });

  it('exactly 4 complex steps, all with intentCaptureRequired=true', () => {
    const steps = P4_BUILD.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex).toHaveLength(4);
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('exactly 4 simple steps, all with intentCaptureRequired=false', () => {
    const steps = P4_BUILD.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    expect(simple).toHaveLength(4);
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('exactly 4 steps have postMeetingUploadExpected=true (the 4 workshop / pilot-launch steps)', () => {
    const steps = P4_BUILD.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual(
      [
        'p4-execution-plan-workshop',
        'p4-pilot-launch',
        'p4-scale-validation-workshop',
        'p4-change-readiness-workshop',
      ].sort(),
    );
  });

  it('simple steps have postMeetingUploadExpected=false (monitoring / interpretation / handoff / go-no-go)', () => {
    const steps = P4_BUILD.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.postMeetingUploadExpected).toBe(false);
    }
  });

  it('the DAG is wired correctly', () => {
    const stepsById = new Map(
      (P4_BUILD.steps ?? []).map((s) => [s.id, s] as const),
    );

    // p4-handoff-ingest is the DAG root.
    const handoff = stepsById.get('p4-handoff-ingest');
    expect(handoff).toBeDefined();
    expect(handoff!.inputs).toEqual([]);

    // p4-execution-plan-workshop consumes the handoff DoD.
    const execPlan = stepsById.get('p4-execution-plan-workshop');
    expect(execPlan).toBeDefined();
    expect(execPlan!.inputs).toContain('detailed-design-available');

    // p4-build-monitoring runs in parallel with pilot-launch — it reads the
    // execution plan but does not depend on the launch.
    const monitoring = stepsById.get('p4-build-monitoring');
    expect(monitoring).toBeDefined();
    expect(monitoring!.inputs).toContain('execution-plan-drafted');
    expect(monitoring!.inputs).not.toContain('p4-pilot-launch-result');

    // p4-pilot-launch reads the execution plan.
    const launch = stepsById.get('p4-pilot-launch');
    expect(launch).toBeDefined();
    expect(launch!.inputs).toContain('execution-plan-drafted');

    // p4-scale-validation-workshop depends on the pilot launch result.
    const scaleVal = stepsById.get('p4-scale-validation-workshop');
    expect(scaleVal).toBeDefined();
    expect(scaleVal!.inputs).toContain('p4-pilot-launch-result');

    // p4-change-readiness-workshop reads the execution plan (parallel to
    // pilot-launch and scale-validation).
    const changeReadiness = stepsById.get('p4-change-readiness-workshop');
    expect(changeReadiness).toBeDefined();
    expect(changeReadiness!.inputs).toContain('execution-plan-drafted');

    // p4-pilot-result-interpretation depends on the pilot result + scale
    // validation result.
    const interp = stepsById.get('p4-pilot-result-interpretation');
    expect(interp).toBeDefined();
    expect(interp!.inputs).toContain('p4-pilot-launch-result');
    expect(interp!.inputs).toContain('p4-scale-validation-result');

    // p4-go-no-go-call depends on everything substantive.
    const gonogo = stepsById.get('p4-go-no-go-call');
    expect(gonogo).toBeDefined();
    expect(gonogo!.inputs).toContain('p4-pilot-result-interpretation-summary');
    expect(gonogo!.inputs).toContain('p4-scale-validation-result');
    expect(gonogo!.inputs).toContain('p4-change-readiness-result');
    expect(gonogo!.inputs).toContain('execution-plan-drafted');
    expect(gonogo!.inputs).toContain('detailed-design-available');
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P4_BUILD.steps ?? [];
    for (const s of steps) {
      expect(Array.isArray(s.preventsFailureModes)).toBe(true);
      expect(s.preventsFailureModes.length).toBeGreaterThan(0);
      for (const id of s.preventsFailureModes) {
        expect(VALID_FAILURE_MODE_IDS.has(id)).toBe(true);
        expect(id).toBeGreaterThanOrEqual(1);
        expect(id).toBeLessThanOrEqual(10);
      }
    }
  });

  it('p4-execution-plan-workshop preventsFailureModes contains 5 (workflow / operating-model change)', () => {
    const execPlan = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-execution-plan-workshop',
    );
    expect(execPlan).toBeDefined();
    expect(execPlan!.preventsFailureModes).toContain(5);
  });

  it('p4-pilot-launch preventsFailureModes contains 8 (pilot-to-production scaling gap)', () => {
    const launch = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-pilot-launch',
    );
    expect(launch).toBeDefined();
    expect(launch!.preventsFailureModes).toContain(8);
  });

  it('p4-change-readiness-workshop preventsFailureModes contains 5 (workflow / operating-model change)', () => {
    const changeReadiness = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-change-readiness-workshop',
    );
    expect(changeReadiness).toBeDefined();
    expect(changeReadiness!.preventsFailureModes).toContain(5);
  });

  it('p4-go-no-go-call preventsFailureModes contains both 1 (sponsor) and 8 (pilot-to-production)', () => {
    const gonogo = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-go-no-go-call',
    );
    expect(gonogo).toBeDefined();
    expect(gonogo!.preventsFailureModes).toContain(1);
    expect(gonogo!.preventsFailureModes).toContain(8);
  });

  it('p4-go-no-go-call outputs reference the P4→P5 gate hard check (design-approved) and the gate decision DoD', () => {
    const gonogo = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-go-no-go-call',
    );
    expect(gonogo).toBeDefined();
    expect(gonogo!.outputs).toContain('design-approved');
    expect(gonogo!.outputs).toContain('kill-or-rebaseline-decision-recorded');
  });

  it('p4-execution-plan-workshop outputs the canonical execution-plan-drafted DoD', () => {
    const execPlan = (P4_BUILD.steps ?? []).find(
      (s) => s.id === 'p4-execution-plan-workshop',
    );
    expect(execPlan).toBeDefined();
    expect(execPlan!.outputs).toContain('execution-plan-drafted');
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P4_BUILD.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });
});
