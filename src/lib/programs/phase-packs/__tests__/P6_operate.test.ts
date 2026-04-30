// P6 Operate · OV2-5-P6 tests
//
// Locks in the 8-step decomposition added by slice OV2-5-P6 — the **final
// phase pack to gain step doctrine**. With this slice, every phase P0..P6
// carries its authored step decomposition end-to-end. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.6.4 — the
//     canonical P6 step list (complex: standing-owner-handoff, first-
//     quarterly-review, vendor-renewal-prep, pattern-catalog-harvest, kill-
//     or-expand-decision; simple: dashboard-live, cost-review-scheduled).
//     The slice spec encodes vendor-renewal-prep + quality-risk-controls as
//     simple per the type-system constraint (StepComplexity admits only
//     'simple' | 'complex'); the design doc's "medium" complexity is
//     documented inline on each affected step.
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.6.1 —
//     failures prevented by P6: #9 (sustained measurement), #5 (sustained
//     workflow / operating-model change), #10 (re-tested expectations,
//     sprawl by abandonment), and the **learning loop** (pattern-catalog
//     harvest is the platform's compounding mechanism).
//   • src/lib/programs/governance.ts — P6 has no formal advance gate; the
//     "gate" is the kill-or-expand decision + pattern-catalog harvest.

import { P6_OPERATE } from '../P6_operate';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P6_STEP_IDS = [
  'p6-handoff-ingest',
  'p6-standing-owner-handoff',
  'p6-quarterly-review-establish',
  'p6-quality-risk-controls-live',
  'p6-first-quarterly-review',
  'p6-vendor-renewal-prep',
  'p6-kill-or-expand-decision',
  'p6-pattern-catalog-harvest',
] as const;

describe('P6 Operate · PhasePack contract still satisfied', () => {
  it('P6_OPERATE conforms to PhasePack', () => {
    const pack: PhasePack = P6_OPERATE;
    expect(pack.phase).toBe(6);
    expect(pack.label).toBe('P6 Operate');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P6 Operate · 8-step decomposition (D.6.4)', () => {
  it('declares exactly 8 steps with the canonical ids in order', () => {
    expect(P6_OPERATE.steps).toBeDefined();
    expect(P6_OPERATE.steps).toHaveLength(8);
    const ids = (P6_OPERATE.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P6_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or are empty for intermediate / harvest artifacts)", () => {
    const dodIds = new Set(P6_OPERATE.definitionOfDone.map((d) => d.id));
    const steps = P6_OPERATE.steps ?? [];
    for (const s of steps) {
      // Empty arrays are allowed (intermediate-artifact producers, plus the
      // pattern-catalog harvest whose real output is outside the DoD). Any
      // present output id MUST match a real DoD id (no invented ids).
      for (const out of s.outputs) {
        expect(dodIds.has(out)).toBe(true);
      }
    }
  });

  it('exactly 5 complex steps, all with intentCaptureRequired=true', () => {
    const steps = P6_OPERATE.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex).toHaveLength(5);
    const complexIds = complex.map((s) => s.id).sort();
    expect(complexIds).toEqual(
      [
        'p6-standing-owner-handoff',
        'p6-quarterly-review-establish',
        'p6-first-quarterly-review',
        'p6-kill-or-expand-decision',
        'p6-pattern-catalog-harvest',
      ].sort(),
    );
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('exactly 3 simple steps, all with intentCaptureRequired=false', () => {
    const steps = P6_OPERATE.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    expect(simple).toHaveLength(3);
    const simpleIds = simple.map((s) => s.id).sort();
    expect(simpleIds).toEqual(
      [
        'p6-handoff-ingest',
        'p6-quality-risk-controls-live',
        'p6-vendor-renewal-prep',
      ].sort(),
    );
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('exactly 5 steps have postMeetingUploadExpected=true (the workshop / interview / harvest steps with real off-platform work)', () => {
    const steps = P6_OPERATE.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual(
      [
        'p6-standing-owner-handoff',
        'p6-quarterly-review-establish',
        'p6-first-quarterly-review',
        'p6-kill-or-expand-decision',
        'p6-pattern-catalog-harvest',
      ].sort(),
    );
  });

  it('simple steps have postMeetingUploadExpected=false (handoff-ingest / quality-controls / vendor-renewal-prep)', () => {
    const steps = P6_OPERATE.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.postMeetingUploadExpected).toBe(false);
    }
  });

  it('the DAG is wired correctly', () => {
    const stepsById = new Map(
      (P6_OPERATE.steps ?? []).map((s) => [s.id, s] as const),
    );

    // p6-handoff-ingest is the DAG root.
    const handoff = stepsById.get('p6-handoff-ingest');
    expect(handoff).toBeDefined();
    expect(handoff!.inputs).toEqual([]);

    // p6-standing-owner-handoff is downstream of handoff-ingest.
    const standingOwner = stepsById.get('p6-standing-owner-handoff');
    expect(standingOwner).toBeDefined();
    expect(standingOwner!.inputs).toContain('p6-handoff-ingest-confirmed');

    // p6-quarterly-review-establish is downstream of standing-owner-named.
    const qrEstablish = stepsById.get('p6-quarterly-review-establish');
    expect(qrEstablish).toBeDefined();
    expect(qrEstablish!.inputs).toContain('standing-owner-named');

    // p6-quality-risk-controls-live runs in parallel from the handoff.
    const qrControls = stepsById.get('p6-quality-risk-controls-live');
    expect(qrControls).toBeDefined();
    expect(qrControls!.inputs).toContain('p6-handoff-ingest-confirmed');
    expect(qrControls!.inputs).not.toContain('standing-owner-named');

    // p6-first-quarterly-review consumes establish + quality-controls +
    // adoption-drift-dashboard (which represents the P5 adoption baseline
    // surfaced via the P6 dashboard DoD).
    const firstReview = stepsById.get('p6-first-quarterly-review');
    expect(firstReview).toBeDefined();
    expect(firstReview!.inputs).toContain('quarterly-operating-review-live');
    expect(firstReview!.inputs).toContain('adoption-drift-dashboard');
    expect(firstReview!.inputs).toContain('quality-and-risk-controls-live');

    // p6-vendor-renewal-prep is parallel and time-triggered (off the handoff).
    const vendorRenewal = stepsById.get('p6-vendor-renewal-prep');
    expect(vendorRenewal).toBeDefined();
    expect(vendorRenewal!.inputs).toContain('p6-handoff-ingest-confirmed');
    expect(vendorRenewal!.inputs).not.toContain('standing-owner-named');

    // p6-kill-or-expand-decision consumes the first quarterly review's
    // intermediate decision-log artifact.
    const killExpand = stepsById.get('p6-kill-or-expand-decision');
    expect(killExpand).toBeDefined();
    expect(killExpand!.inputs).toContain(
      'p6-first-quarterly-review-decision-log',
    );

    // p6-pattern-catalog-harvest consumes everything substantive.
    const harvest = stepsById.get('p6-pattern-catalog-harvest');
    expect(harvest).toBeDefined();
    expect(harvest!.inputs).toContain('standing-owner-named');
    expect(harvest!.inputs).toContain('quarterly-operating-review-live');
    expect(harvest!.inputs).toContain('adoption-drift-dashboard');
    expect(harvest!.inputs).toContain('quality-and-risk-controls-live');
    expect(harvest!.inputs).toContain('cost-and-vendor-review-ready');
    expect(harvest!.inputs).toContain('kill-or-expand-thresholds-owned');
    expect(harvest!.inputs).toContain(
      'p6-first-quarterly-review-decision-log',
    );
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P6_OPERATE.steps ?? [];
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

  it('p6-quarterly-review-establish preventsFailureModes contains 9 (sustained measurement)', () => {
    const qrEstablish = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-quarterly-review-establish',
    );
    expect(qrEstablish).toBeDefined();
    expect(qrEstablish!.preventsFailureModes).toContain(9);
  });

  it('p6-kill-or-expand-decision preventsFailureModes contains 10 (re-tested expectations / sprawl)', () => {
    const killExpand = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-kill-or-expand-decision',
    );
    expect(killExpand).toBeDefined();
    expect(killExpand!.preventsFailureModes).toContain(10);
  });

  it('p6-pattern-catalog-harvest preventsFailureModes includes both 9 and 10 (the learning loop is the platform-level prevention of #9 + #10 across archetype-programs)', () => {
    const harvest = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-pattern-catalog-harvest',
    );
    expect(harvest).toBeDefined();
    expect(harvest!.preventsFailureModes).toContain(9);
    expect(harvest!.preventsFailureModes).toContain(10);
  });

  it('the learning-loop step (p6-pattern-catalog-harvest) is present and outputs an empty DoD set (its real output is a write to the pattern catalog, outside the P6 DoD)', () => {
    const harvest = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-pattern-catalog-harvest',
    );
    expect(harvest).toBeDefined();
    expect(harvest!.complexity).toBe('complex');
    expect(harvest!.agentRole).toBe('compose_artifact');
    expect(harvest!.outputs).toEqual([]);
  });

  it('p6-standing-owner-handoff outputs the canonical standing-owner-named DoD', () => {
    const standingOwner = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-standing-owner-handoff',
    );
    expect(standingOwner).toBeDefined();
    expect(standingOwner!.outputs).toContain('standing-owner-named');
  });

  it('p6-quarterly-review-establish outputs the canonical quarterly-operating-review-live and adoption-drift-dashboard DoDs', () => {
    const qrEstablish = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-quarterly-review-establish',
    );
    expect(qrEstablish).toBeDefined();
    expect(qrEstablish!.outputs).toContain('quarterly-operating-review-live');
    expect(qrEstablish!.outputs).toContain('adoption-drift-dashboard');
  });

  it('p6-vendor-renewal-prep outputs the canonical cost-and-vendor-review-ready DoD', () => {
    const vendorRenewal = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-vendor-renewal-prep',
    );
    expect(vendorRenewal).toBeDefined();
    expect(vendorRenewal!.outputs).toContain('cost-and-vendor-review-ready');
  });

  it('p6-kill-or-expand-decision outputs the canonical kill-or-expand-thresholds-owned DoD', () => {
    const killExpand = (P6_OPERATE.steps ?? []).find(
      (s) => s.id === 'p6-kill-or-expand-decision',
    );
    expect(killExpand).toBeDefined();
    expect(killExpand!.outputs).toContain('kill-or-expand-thresholds-owned');
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P6_OPERATE.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });
});
