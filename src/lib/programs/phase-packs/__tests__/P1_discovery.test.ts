// P1 Discovery · OV2-5-P1 tests
//
// Locks in the 8-step decomposition added by slice OV2-5-P1. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.1.4 — the 8
//     canonical P1 steps with complexity / agent role / outputs / prevents.
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.1.1 — failures
//     prevented by P1 (#2 problem, #3 data, #9 measurement, #1 sponsor, #4 talent).

import { P1_DISCOVERY } from '../P1_discovery';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P1_STEP_IDS = [
  'p1-handoff-ingest',
  'p1-data-discovery',
  'p1-baseline-capture',
  'p1-stakeholder-mapping',
  'p1-root-cause-synthesis',
  'p1-pattern-evidence',
  'p1-contradictions-log',
  'p1-p2-readiness-call',
] as const;

// `current-state-system-of-record` is a rightQuestions.open id, not a DoD id.
// It is the documented exception in slice OV2-5-P1 — used as the output of
// p1-data-discovery to make the DAG legible (system-of-record is identified
// before baseline-capture samples it).
const NON_DOD_OUTPUT_EXCEPTIONS = new Set(['current-state-system-of-record']);

describe('P1 Discovery · PhasePack contract still satisfied', () => {
  it('P1_DISCOVERY conforms to PhasePack', () => {
    const pack: PhasePack = P1_DISCOVERY;
    expect(pack.phase).toBe(1);
    expect(pack.label).toBe('P1 Discovery');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P1 Discovery · 8-step decomposition (D.1.4)', () => {
  it('declares exactly 8 steps with the canonical ids in order', () => {
    expect(P1_DISCOVERY.steps).toBeDefined();
    expect(P1_DISCOVERY.steps).toHaveLength(8);
    const ids = (P1_DISCOVERY.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P1_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or the documented exception)", () => {
    const dodIds = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));
    const steps = P1_DISCOVERY.steps ?? [];
    for (const s of steps) {
      for (const out of s.outputs) {
        const isDodId = dodIds.has(out);
        const isException = NON_DOD_OUTPUT_EXCEPTIONS.has(out);
        expect(isDodId || isException).toBe(true);
      }
    }
  });

  it('all complex steps have intentCaptureRequired=true', () => {
    const steps = P1_DISCOVERY.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex.length).toBeGreaterThan(0);
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('simple steps have intentCaptureRequired=false', () => {
    const steps = P1_DISCOVERY.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('exactly 5 steps have postMeetingUploadExpected=true (4 workshops + stakeholder mapping)', () => {
    const steps = P1_DISCOVERY.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual(
      [
        'p1-data-discovery',
        'p1-baseline-capture',
        'p1-root-cause-synthesis',
        'p1-pattern-evidence',
        'p1-stakeholder-mapping',
      ].sort(),
    );
  });

  it('the DAG wires baseline -> data discovery, synthesis -> baseline+stakeholder, readiness -> synthesis+contradictions', () => {
    const stepsById = new Map(
      (P1_DISCOVERY.steps ?? []).map((s) => [s.id, s] as const),
    );

    const baseline = stepsById.get('p1-baseline-capture');
    expect(baseline).toBeDefined();
    expect(baseline!.inputs).toContain('current-state-system-of-record');

    const synthesis = stepsById.get('p1-root-cause-synthesis');
    expect(synthesis).toBeDefined();
    expect(synthesis!.inputs).toContain('okr-baseline-captured');
    expect(synthesis!.inputs).toContain('stakeholder-map-named');

    const readiness = stepsById.get('p1-p2-readiness-call');
    expect(readiness).toBeDefined();
    expect(readiness!.inputs).toContain('validated-problem-statement');
    expect(readiness!.inputs).toContain('discovery-contradictions-logged');
  });

  it('p1-handoff-ingest has no inputs (it is the DAG root)', () => {
    const root = (P1_DISCOVERY.steps ?? []).find(
      (s) => s.id === 'p1-handoff-ingest',
    );
    expect(root).toBeDefined();
    expect(root!.inputs).toEqual([]);
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P1_DISCOVERY.steps ?? [];
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

  it('p1-baseline-capture preventsFailureModes contains 9 (measurement)', () => {
    const baseline = (P1_DISCOVERY.steps ?? []).find(
      (s) => s.id === 'p1-baseline-capture',
    );
    expect(baseline).toBeDefined();
    expect(baseline!.preventsFailureModes).toContain(9);
  });

  it('p1-stakeholder-mapping preventsFailureModes contains 1 (sponsor) and 4 (talent map)', () => {
    const stakeholder = (P1_DISCOVERY.steps ?? []).find(
      (s) => s.id === 'p1-stakeholder-mapping',
    );
    expect(stakeholder).toBeDefined();
    expect(stakeholder!.preventsFailureModes).toContain(1);
    expect(stakeholder!.preventsFailureModes).toContain(4);
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P1_DISCOVERY.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });
});
