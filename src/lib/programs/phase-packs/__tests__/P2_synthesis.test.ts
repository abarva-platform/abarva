// P2 Synthesis · OV2-5-P2 tests
//
// Locks in the 9-step decomposition added by slice OV2-5-P2. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.2.4 — the 9
//     canonical P2 steps with complexity / agent role / outputs / prevents.
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.2.1 — failures
//     prevented by P2 (#2 problem, #6 governance, #1 sponsor, #10 sprawl).

import { P2_SYNTHESIS } from '../P2_synthesis';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P2_STEP_IDS = [
  'p2-options-author',
  'p2-tradeoff-workshop',
  'p2-architecture-review',
  'p2-charter-author',
  'p2-sponsor-defense',
  'p2-kill-criterion',
  'p2-succession-named',
  'p2-charter-signoff',
  'p2-dissenter-engaged',
] as const;

describe('P2 Synthesis · PhasePack contract still satisfied', () => {
  it('P2_SYNTHESIS conforms to PhasePack', () => {
    const pack: PhasePack = P2_SYNTHESIS;
    expect(pack.phase).toBe(2);
    expect(pack.label).toBe('P2 Synthesis');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P2 Synthesis · 9-step decomposition (D.2.4)', () => {
  it('declares exactly 9 steps with the canonical ids in order', () => {
    expect(P2_SYNTHESIS.steps).toBeDefined();
    expect(P2_SYNTHESIS.steps).toHaveLength(9);
    const ids = (P2_SYNTHESIS.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P2_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or are empty for intermediate artifacts)", () => {
    const dodIds = new Set(P2_SYNTHESIS.definitionOfDone.map((d) => d.id));
    const steps = P2_SYNTHESIS.steps ?? [];
    for (const s of steps) {
      // Empty arrays are allowed (intermediate-artifact producers); but if
      // any output id is present, it MUST match a real DoD id (no invented
      // ids).
      for (const out of s.outputs) {
        expect(dodIds.has(out)).toBe(true);
      }
    }
  });

  it('exactly 4 complex steps, all with intentCaptureRequired=true', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex).toHaveLength(4);
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('exactly 5 simple steps, all with intentCaptureRequired=false', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    expect(simple).toHaveLength(5);
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('the 4 workshop / interview / review steps have postMeetingUploadExpected=true', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual(
      [
        'p2-tradeoff-workshop',
        'p2-architecture-review',
        'p2-sponsor-defense',
        'p2-dissenter-engaged',
      ].sort(),
    );
  });

  it('simple steps have postMeetingUploadExpected=false', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.postMeetingUploadExpected).toBe(false);
    }
  });

  it('the DAG is wired correctly', () => {
    const stepsById = new Map(
      (P2_SYNTHESIS.steps ?? []).map((s) => [s.id, s] as const),
    );

    // p2-tradeoff-workshop consumes the options-author intermediate output.
    const workshop = stepsById.get('p2-tradeoff-workshop');
    expect(workshop).toBeDefined();
    expect(workshop!.inputs).toContain('p2-options-table');

    // p2-charter-author consumes the workshop and architecture-review outputs.
    const charterAuthor = stepsById.get('p2-charter-author');
    expect(charterAuthor).toBeDefined();
    expect(charterAuthor!.inputs).toContain('synthesis-options-compared');
    expect(charterAuthor!.inputs).toContain('architecture-review-attested');

    // p2-sponsor-defense consumes the charter draft.
    const sponsorDefense = stepsById.get('p2-sponsor-defense');
    expect(sponsorDefense).toBeDefined();
    expect(sponsorDefense!.inputs).toContain('p2-charter-draft');

    // p2-charter-signoff consumes everything substantive: workshop,
    // architecture, kill-criterion, succession.
    const signoff = stepsById.get('p2-charter-signoff');
    expect(signoff).toBeDefined();
    expect(signoff!.inputs).toContain('synthesis-options-compared');
    expect(signoff!.inputs).toContain('architecture-review-attested');
    expect(signoff!.inputs).toContain('kill-criterion-locked');
    expect(signoff!.inputs).toContain('succession-owner-named');
  });

  it('p2-options-author and p2-architecture-review are DAG roots (empty inputs)', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    const optionsAuthor = steps.find((s) => s.id === 'p2-options-author');
    const archReview = steps.find((s) => s.id === 'p2-architecture-review');
    expect(optionsAuthor).toBeDefined();
    expect(archReview).toBeDefined();
    expect(optionsAuthor!.inputs).toEqual([]);
    expect(archReview!.inputs).toEqual([]);
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
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

  it('p2-architecture-review preventsFailureModes contains 6 (governance / privacy / risk)', () => {
    const archReview = (P2_SYNTHESIS.steps ?? []).find(
      (s) => s.id === 'p2-architecture-review',
    );
    expect(archReview).toBeDefined();
    expect(archReview!.preventsFailureModes).toContain(6);
  });

  it('p2-sponsor-defense preventsFailureModes contains 1 (sponsor commitment)', () => {
    const sponsorDefense = (P2_SYNTHESIS.steps ?? []).find(
      (s) => s.id === 'p2-sponsor-defense',
    );
    expect(sponsorDefense).toBeDefined();
    expect(sponsorDefense!.preventsFailureModes).toContain(1);
  });

  it('p2-kill-criterion preventsFailureModes contains both 2 and 10', () => {
    const killCriterion = (P2_SYNTHESIS.steps ?? []).find(
      (s) => s.id === 'p2-kill-criterion',
    );
    expect(killCriterion).toBeDefined();
    expect(killCriterion!.preventsFailureModes).toContain(2);
    expect(killCriterion!.preventsFailureModes).toContain(10);
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P2_SYNTHESIS.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });
});
