// Phase packs · OV2-6b-rest failure-mode tagging sweep
//
// Verifies that every definitionOfDone item, rightQuestion (open / converge /
// close), and antiPattern in P1..P6 packs carries a non-empty
// preventsFailureModes array referencing valid FAILURE_MODES ids (1..10), and
// that each pack's union of tags covers the primary failure modes called out
// in docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md sections
// D.1.1 through D.6.1.
//
// P0 is intentionally excluded — its tagging is owned by the parallel slice
// OV2-P0-complete and locked in src/lib/programs/phase-packs/__tests__/P0_originate.test.ts.

import { P1_DISCOVERY } from '../P1_discovery';
import { P2_SYNTHESIS } from '../P2_synthesis';
import { P3_DESIGN } from '../P3_design';
import { P4_BUILD } from '../P4_build';
import { P5_ACTIVATE } from '../P5_activate';
import { P6_OPERATE } from '../P6_operate';
import type { PhasePack } from '../types';
import { FAILURE_MODES, getFailureMode } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

interface PackUnderTest {
  pack: PhasePack;
  /** Per design doc D.{phase}.1, the primary failure modes the phase prevents. */
  expectedPrimaryFailureModes: number[];
}

const PACKS_UNDER_TEST: readonly PackUnderTest[] = [
  // D.1.1 — P1 Discovery prevents #2, #3, #4, #9 (baseline half).
  { pack: P1_DISCOVERY, expectedPrimaryFailureModes: [2, 3, 4, 9] },
  // D.2.1 — P2 Synthesis prevents #2 (sharpened), #6, #1 (re-tested), #10.
  { pack: P2_SYNTHESIS, expectedPrimaryFailureModes: [1, 2, 6, 10] },
  // D.3.1 — P3 Design prevents #5, #6, #7, #1 (confirmed).
  { pack: P3_DESIGN, expectedPrimaryFailureModes: [1, 5, 6, 7] },
  // D.4.1 — P4 Execution Roadmap prevents #5, #8, #3 (operational).
  { pack: P4_BUILD, expectedPrimaryFailureModes: [3, 5, 8] },
  // D.5.1 — P5 Approval & Mobilization prevents #5, #8, #9 (instrumentation).
  { pack: P5_ACTIVATE, expectedPrimaryFailureModes: [5, 8, 9] },
  // D.6.1 — P6 Tower Handoff prevents #9 (sustained), #5 (sustained), #10 (re-tested).
  { pack: P6_OPERATE, expectedPrimaryFailureModes: [5, 9, 10] },
] as const;

function collectTagUnion(pack: PhasePack): Set<number> {
  const union = new Set<number>();
  for (const item of pack.definitionOfDone) {
    for (const id of item.preventsFailureModes ?? []) union.add(id);
  }
  for (const q of [
    ...pack.rightQuestions.open,
    ...pack.rightQuestions.converge,
    ...pack.rightQuestions.close,
  ]) {
    for (const id of q.preventsFailureModes ?? []) union.add(id);
  }
  for (const ap of pack.antiPatterns) {
    for (const id of ap.preventsFailureModes ?? []) union.add(id);
  }
  return union;
}

describe.each(PACKS_UNDER_TEST)(
  'Phase pack $pack.label · failure-mode tagging coverage',
  ({ pack, expectedPrimaryFailureModes }) => {
    it('every definitionOfDone item has a non-empty preventsFailureModes', () => {
      expect(pack.definitionOfDone.length).toBeGreaterThan(0);
      for (const item of pack.definitionOfDone) {
        expect(item.preventsFailureModes).toBeDefined();
        expect(Array.isArray(item.preventsFailureModes)).toBe(true);
        expect(item.preventsFailureModes!.length).toBeGreaterThan(0);
      }
    });

    it('every rightQuestion (open + converge + close) has a non-empty preventsFailureModes', () => {
      const allQuestions = [
        ...pack.rightQuestions.open,
        ...pack.rightQuestions.converge,
        ...pack.rightQuestions.close,
      ];
      expect(allQuestions.length).toBeGreaterThan(0);
      for (const q of allQuestions) {
        expect(q.preventsFailureModes).toBeDefined();
        expect(Array.isArray(q.preventsFailureModes)).toBe(true);
        expect(q.preventsFailureModes!.length).toBeGreaterThan(0);
      }
    });

    it('every antiPattern has a non-empty preventsFailureModes', () => {
      expect(pack.antiPatterns.length).toBeGreaterThan(0);
      for (const ap of pack.antiPatterns) {
        expect(ap.preventsFailureModes).toBeDefined();
        expect(Array.isArray(ap.preventsFailureModes)).toBe(true);
        expect(ap.preventsFailureModes!.length).toBeGreaterThan(0);
      }
    });

    it('every tagged id is a valid FAILURE_MODES id (1..10) and resolves via getFailureMode', () => {
      const allIds: number[] = [];
      for (const item of pack.definitionOfDone) {
        allIds.push(...(item.preventsFailureModes ?? []));
      }
      for (const q of [
        ...pack.rightQuestions.open,
        ...pack.rightQuestions.converge,
        ...pack.rightQuestions.close,
      ]) {
        allIds.push(...(q.preventsFailureModes ?? []));
      }
      for (const ap of pack.antiPatterns) {
        allIds.push(...(ap.preventsFailureModes ?? []));
      }
      expect(allIds.length).toBeGreaterThan(0);
      for (const id of allIds) {
        expect(VALID_FAILURE_MODE_IDS.has(id)).toBe(true);
        expect(getFailureMode(id)).not.toBeNull();
      }
    });

    it('union of preventsFailureModes covers the design-doc primary failure modes', () => {
      const union = collectTagUnion(pack);
      for (const expectedId of expectedPrimaryFailureModes) {
        expect(union.has(expectedId)).toBe(true);
      }
    });
  },
);
