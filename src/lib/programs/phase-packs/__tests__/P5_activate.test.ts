// P5 Activate · OV2-5-P5 tests
//
// Locks in the 8-step decomposition added by slice OV2-5-P5. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.5.4 — the
//     canonical P5 step list (complex: rollout-wave-prep, rollout-wave-launch,
//     rollout-wave-debrief, cxo-verification-call; simple: handoff-ingest,
//     adoption-monitoring, support-and-exceptions,
//     benefits-attestation-and-outcome-report).
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.5.1 —
//     failures prevented by P5 (#5 workflow / operating-model change executes,
//     #8 pilot-to-production scaling gap, #9 instrumentation).
//   • src/lib/programs/governance.ts — P5 → P6 gate rules: cxo_verification,
//     benefits_realization (hard) and outcome_report_drafted (soft).

import { P5_ACTIVATE } from '../P5_activate';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P5_STEP_IDS = [
  'p5-handoff-ingest',
  'p5-rollout-wave-prep',
  'p5-rollout-wave-launch',
  'p5-rollout-wave-debrief',
  'p5-adoption-monitoring',
  'p5-support-and-exceptions',
  'p5-cxo-verification-call',
  'p5-benefits-attestation-and-outcome-report',
] as const;

describe('P5 Activate · PhasePack contract still satisfied', () => {
  it('P5_ACTIVATE conforms to PhasePack', () => {
    const pack: PhasePack = P5_ACTIVATE;
    expect(pack.phase).toBe(5);
    expect(pack.label).toBe('P5 Activate');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P5 Activate · 8-step decomposition (D.5.4)', () => {
  it('declares exactly 8 steps with the canonical ids in order', () => {
    expect(P5_ACTIVATE.steps).toBeDefined();
    expect(P5_ACTIVATE.steps).toHaveLength(8);
    const ids = (P5_ACTIVATE.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P5_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or are empty for intermediate artifacts)", () => {
    const dodIds = new Set(P5_ACTIVATE.definitionOfDone.map((d) => d.id));
    const steps = P5_ACTIVATE.steps ?? [];
    for (const s of steps) {
      // Empty arrays are allowed (intermediate-artifact producers). If any
      // output id is present, it MUST match a real DoD id (no invented ids).
      for (const out of s.outputs) {
        expect(dodIds.has(out)).toBe(true);
      }
    }
  });

  it('exactly 4 complex steps, all with intentCaptureRequired=true', () => {
    const steps = P5_ACTIVATE.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex).toHaveLength(4);
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('exactly 4 simple steps, all with intentCaptureRequired=false', () => {
    const steps = P5_ACTIVATE.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    expect(simple).toHaveLength(4);
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('exactly 4 steps have postMeetingUploadExpected=true (the 3 wave steps + the CXO interview)', () => {
    const steps = P5_ACTIVATE.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual(
      [
        'p5-rollout-wave-prep',
        'p5-rollout-wave-launch',
        'p5-rollout-wave-debrief',
        'p5-cxo-verification-call',
      ].sort(),
    );
  });

  it('simple steps have postMeetingUploadExpected=false (handoff / monitoring / support / compose)', () => {
    const steps = P5_ACTIVATE.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.postMeetingUploadExpected).toBe(false);
    }
  });

  it('the wave-aware DAG is wired correctly', () => {
    const stepsById = new Map(
      (P5_ACTIVATE.steps ?? []).map((s) => [s.id, s] as const),
    );

    // p5-handoff-ingest is the DAG root.
    const handoff = stepsById.get('p5-handoff-ingest');
    expect(handoff).toBeDefined();
    expect(handoff!.inputs).toEqual([]);

    // Wave sub-loop: prep → launch → debrief.
    const wavePrep = stepsById.get('p5-rollout-wave-prep');
    expect(wavePrep).toBeDefined();
    expect(wavePrep!.inputs).toContain('p5-handoff-summary');

    const waveLaunch = stepsById.get('p5-rollout-wave-launch');
    expect(waveLaunch).toBeDefined();
    expect(waveLaunch!.inputs).toContain('p5-rollout-wave-prep-result');

    const waveDebrief = stepsById.get('p5-rollout-wave-debrief');
    expect(waveDebrief).toBeDefined();
    expect(waveDebrief!.inputs).toContain('p5-rollout-wave-launch-result');
    // The wave debrief is the step that emits the cumulative
    // `rollout-waves-completed` DoD.
    expect(waveDebrief!.outputs).toContain('rollout-waves-completed');

    // Adoption monitoring runs in parallel with the wave loop, reading the
    // launch result continuously across waves rather than waiting on debrief.
    const monitoring = stepsById.get('p5-adoption-monitoring');
    expect(monitoring).toBeDefined();
    expect(monitoring!.inputs).toContain('p5-rollout-wave-launch-result');
    expect(monitoring!.inputs).not.toContain('cxo-verification-complete');
    expect(monitoring!.outputs).toContain('adoption-telemetry-baselined');

    // Support and exceptions converges on operating-readiness DoDs once
    // waves have completed.
    const support = stepsById.get('p5-support-and-exceptions');
    expect(support).toBeDefined();
    expect(support!.inputs).toContain('rollout-waves-completed');
    expect(support!.outputs).toContain('support-readiness-live');
    expect(support!.outputs).toContain('exception-paths-controlled');

    // CXO verification consumes adoption telemetry + the outcome-report draft
    // accumulated through the wave debriefs.
    const cxo = stepsById.get('p5-cxo-verification-call');
    expect(cxo).toBeDefined();
    expect(cxo!.inputs).toContain('adoption-telemetry-baselined');
    expect(cxo!.inputs).toContain('p5-outcome-report-draft');
    expect(cxo!.outputs).toContain('cxo-verification-complete');

    // Benefits attestation + outcome report consumes everything substantive.
    const compose = stepsById.get(
      'p5-benefits-attestation-and-outcome-report',
    );
    expect(compose).toBeDefined();
    expect(compose!.inputs).toContain('rollout-waves-completed');
    expect(compose!.inputs).toContain('adoption-telemetry-baselined');
    expect(compose!.inputs).toContain('support-readiness-live');
    expect(compose!.inputs).toContain('exception-paths-controlled');
    expect(compose!.inputs).toContain('cxo-verification-complete');
    expect(compose!.outputs).toContain('benefits-realization-attested');
    expect(compose!.outputs).toContain('outcome-report-drafted');
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P5_ACTIVATE.steps ?? [];
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

  it('p5-rollout-wave-launch preventsFailureModes contains both 5 and 8', () => {
    const launch = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-rollout-wave-launch',
    );
    expect(launch).toBeDefined();
    expect(launch!.preventsFailureModes).toContain(5);
    expect(launch!.preventsFailureModes).toContain(8);
  });

  it('p5-cxo-verification-call preventsFailureModes contains 1 (sponsor / CXO commitment)', () => {
    const cxo = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-cxo-verification-call',
    );
    expect(cxo).toBeDefined();
    expect(cxo!.preventsFailureModes).toContain(1);
  });

  it('p5-adoption-monitoring preventsFailureModes contains 9 (instrumentation)', () => {
    const monitoring = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-adoption-monitoring',
    );
    expect(monitoring).toBeDefined();
    expect(monitoring!.preventsFailureModes).toContain(9);
  });

  it('p5-rollout-wave-debrief outputs the canonical rollout-waves-completed DoD', () => {
    const debrief = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-rollout-wave-debrief',
    );
    expect(debrief).toBeDefined();
    expect(debrief!.outputs).toContain('rollout-waves-completed');
  });

  it('p5-benefits-attestation-and-outcome-report outputs both gate DoDs (benefits + outcome report)', () => {
    const compose = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-benefits-attestation-and-outcome-report',
    );
    expect(compose).toBeDefined();
    expect(compose!.outputs).toContain('benefits-realization-attested');
    expect(compose!.outputs).toContain('outcome-report-drafted');
  });

  it('p5-cxo-verification-call outputs the canonical cxo-verification-complete DoD', () => {
    const cxo = (P5_ACTIVATE.steps ?? []).find(
      (s) => s.id === 'p5-cxo-verification-call',
    );
    expect(cxo).toBeDefined();
    expect(cxo!.outputs).toContain('cxo-verification-complete');
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P5_ACTIVATE.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });
});
