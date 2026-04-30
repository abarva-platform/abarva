// P0 Originate · OV2-P0-complete tests
//
// Locks in the failure-mode tagging and the 8-step decomposition added by
// slice OV2-P0-complete. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.0.1 — failures
//     prevented by P0 (#1 sponsor, #2 problem definition, #4 talent, #10 sprawl).
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.0.4 — the 8
//     canonical P0 steps with complexity / agent role / outputs / prevents.

import { P0_ORIGINATE } from '../P0_originate';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P0_STEP_IDS = [
  'p0-trigger-and-window',
  'p0-first-cohort',
  'p0-value-hypothesis',
  'p0-sponsor-candidate',
  'p0-pattern-classification',
  'p0-discovery-envelope',
  'p0-evidence-family',
  'p0-submit-for-approval',
] as const;

describe('P0 Originate · PhasePack contract still satisfied', () => {
  it('P0_ORIGINATE conforms to PhasePack', () => {
    const pack: PhasePack = P0_ORIGINATE;
    expect(pack.phase).toBe(0);
    expect(pack.label).toBe('P0 Originate');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P0 Originate · failure-mode tagging coverage', () => {
  it('every definitionOfDone item has a non-empty preventsFailureModes', () => {
    expect(P0_ORIGINATE.definitionOfDone.length).toBeGreaterThan(0);
    for (const item of P0_ORIGINATE.definitionOfDone) {
      expect(item.preventsFailureModes).toBeDefined();
      expect(Array.isArray(item.preventsFailureModes)).toBe(true);
      expect(item.preventsFailureModes!.length).toBeGreaterThan(0);
    }
  });

  it('every right-question (open/converge/close) has a non-empty preventsFailureModes', () => {
    const all = [
      ...P0_ORIGINATE.rightQuestions.open,
      ...P0_ORIGINATE.rightQuestions.converge,
      ...P0_ORIGINATE.rightQuestions.close,
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const q of all) {
      expect(q.preventsFailureModes).toBeDefined();
      expect(Array.isArray(q.preventsFailureModes)).toBe(true);
      expect(q.preventsFailureModes!.length).toBeGreaterThan(0);
    }
  });

  it('every anti-pattern has a non-empty preventsFailureModes', () => {
    expect(P0_ORIGINATE.antiPatterns.length).toBeGreaterThan(0);
    for (const ap of P0_ORIGINATE.antiPatterns) {
      expect(ap.preventsFailureModes).toBeDefined();
      expect(Array.isArray(ap.preventsFailureModes)).toBe(true);
      expect(ap.preventsFailureModes!.length).toBeGreaterThan(0);
    }
  });

  it('every tagged failure-mode id is a valid id from FAILURE_MODES (1..10)', () => {
    const allTaggedIds: number[] = [];
    for (const item of P0_ORIGINATE.definitionOfDone) {
      allTaggedIds.push(...(item.preventsFailureModes ?? []));
    }
    for (const q of [
      ...P0_ORIGINATE.rightQuestions.open,
      ...P0_ORIGINATE.rightQuestions.converge,
      ...P0_ORIGINATE.rightQuestions.close,
    ]) {
      allTaggedIds.push(...(q.preventsFailureModes ?? []));
    }
    for (const ap of P0_ORIGINATE.antiPatterns) {
      allTaggedIds.push(...(ap.preventsFailureModes ?? []));
    }
    for (const step of P0_ORIGINATE.steps ?? []) {
      allTaggedIds.push(...step.preventsFailureModes);
    }

    expect(allTaggedIds.length).toBeGreaterThan(0);
    for (const id of allTaggedIds) {
      expect(VALID_FAILURE_MODE_IDS.has(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThanOrEqual(10);
    }
  });
});

describe('P0 Originate · 8-step decomposition (D.0.4)', () => {
  it('declares exactly 8 steps with the canonical ids in order', () => {
    expect(P0_ORIGINATE.steps).toBeDefined();
    expect(P0_ORIGINATE.steps).toHaveLength(8);
    const ids = (P0_ORIGINATE.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P0_STEP_IDS]);
  });

  it('the two complex steps are p0-value-hypothesis and p0-sponsor-candidate, with intentCaptureRequired=true', () => {
    const steps = P0_ORIGINATE.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex.map((s) => s.id).sort()).toEqual(
      ['p0-sponsor-candidate', 'p0-value-hypothesis'].sort(),
    );
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('simple steps have intentCaptureRequired=false', () => {
    const steps = P0_ORIGINATE.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('only p0-sponsor-candidate has postMeetingUploadExpected=true', () => {
    const steps = P0_ORIGINATE.steps ?? [];
    for (const s of steps) {
      if (s.id === 'p0-sponsor-candidate') {
        expect(s.postMeetingUploadExpected).toBe(true);
      } else {
        expect(s.postMeetingUploadExpected).toBe(false);
      }
    }
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids', () => {
    const steps = P0_ORIGINATE.steps ?? [];
    for (const s of steps) {
      expect(Array.isArray(s.preventsFailureModes)).toBe(true);
      expect(s.preventsFailureModes.length).toBeGreaterThan(0);
      for (const id of s.preventsFailureModes) {
        expect(VALID_FAILURE_MODE_IDS.has(id)).toBe(true);
      }
    }
  });
});
