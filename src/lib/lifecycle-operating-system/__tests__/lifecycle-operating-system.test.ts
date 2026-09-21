import { getPhasePack, listAuthoredPhases } from '@/lib/programs/phase-packs';
import { getStagePack, listAuthoredStages } from '@/lib/source/stage-packs';
import {
  FAILURE_MODE_CONTROLS,
  buildProgramLifecycleContract,
  buildSourceLifecycleContract,
} from '..';
import type { LifecycleCompletionContract } from '../types';

const programContracts = listAuthoredPhases().map((phase) => {
  const pack = getPhasePack(phase);
  if (!pack) throw new Error(`Missing program phase pack ${phase}`);
  return buildProgramLifecycleContract(pack);
});

const sourceContracts = listAuthoredStages().map((stage) => {
  const pack = getStagePack(stage);
  if (!pack) throw new Error(`Missing source stage pack ${stage}`);
  return buildSourceLifecycleContract(pack);
});

const allContracts: LifecycleCompletionContract[] = [...programContracts, ...sourceContracts];

describe('lifecycle operating system contracts', () => {
  // The Programs list is six, not seven, and the seventh was never reachable.
  //
  // This expectation asked for `programs:P6` from the day the suite landed, and
  // the suite has therefore never passed on `main`. It arrived inside the same
  // squash commit as the phase-pack registry it asserts against, and that
  // registry already held six packs: `PhaseNumber` is `0 | 1 | 2 | 3 | 4 | 5`
  // in both `phase-packs/types.ts` and `phase-packs/types.v2.ts`, `getPhasePack`
  // rejects anything above 5, and P6 had been retired from phase packs and
  // failure modes before the suite was written. A seventh contract is not
  // missing data — the authored model cannot express it, so no change to the
  // builders could have turned this case green.
  //
  // The list stays hand-typed rather than derived from `listAuthoredPhases()`,
  // which is where `programContracts` already comes from: a list read back from
  // the thing under test cannot fail. Typed out, it still fails if a pack is
  // added or silently dropped, which is the regression worth holding.
  //
  // What is NOT settled here: the product surface still speaks a seven-phase
  // P0-P6 lifecycle and renders a "P6 Tower Handoff" workbench and gate panel
  // (`src/lib/programs/programs-detail-view.ts`). So a phase the product
  // displays has no lifecycle completion contract behind it. Whether P6 earns
  // one or is deliberately outside the Programs lifecycle is an owner decision,
  // filed as backlog item T-452; it is not resolved by correcting this list.
  it('covers every authored Programs phase and Source stage', () => {
    expect(programContracts.map((contract) => contract.id)).toEqual([
      'programs:P0',
      'programs:P1',
      'programs:P2',
      'programs:P3',
      'programs:P4',
      'programs:P5',
    ]);
    expect(sourceContracts.map((contract) => contract.id)).toEqual([
      'source:S0',
      'source:S1',
      'source:S2',
      'source:S3',
      'source:S4',
      'source:S5',
      'source:S6',
      'source:S7',
    ]);
  });

  it.each(allContracts)('$id has completion criteria, steps, approval, and next-phase primer', (contract) => {
    expect(contract.outcome.length).toBeGreaterThan(80);
    expect(contract.universalDefinitionOfDone.length).toBeGreaterThan(0);
    expect(contract.parameterizedElements.length).toBeGreaterThan(0);
    expect(contract.steps.length).toBeGreaterThanOrEqual(3);
    expect(contract.approval.authority.length).toBeGreaterThan(10);
    expect(contract.nextPhasePrimer.requiredCarryForward.length).toBeGreaterThan(0);
    expect(contract.failureModeControls.length).toBeGreaterThan(0);
  });

  it.each(allContracts)('$id gives every step intent, mode, evidence, and failure prevention', (contract) => {
    for (const step of contract.steps) {
      expect(step.intent.length).toBeGreaterThan(40);
      expect(['simple', 'complex']).toContain(step.complexity);
      expect(step.humanWorkRequired.length).toBeGreaterThan(0);
      expect(step.templates.length).toBeGreaterThan(0);
      expect(step.evidenceRequired.length).toBeGreaterThan(0);
      expect(step.failureModesPrevented.length).toBeGreaterThan(0);
      expect(step.producesForNext.length).toBeGreaterThan(0);
    }
  });

  it.each(allContracts)('$id complex steps include workshop/data/gate scaffolding', (contract) => {
    const complex = contract.steps.filter((step) => step.complexity === 'complex');
    expect(complex.length).toBeGreaterThan(0);
    for (const step of complex) {
      const templateKinds = step.templates.map((template) => template.kind);
      expect(templateKinds.some((kind) => kind === 'workshop_pack' || kind === 'data_request' || kind === 'approval_packet')).toBe(true);
    }
  });

  it('keeps failure-mode ids tied to the canonical platform promise taxonomy', () => {
    const canonicalIds = new Set(Object.keys(FAILURE_MODE_CONTROLS));
    for (const contract of allContracts) {
      for (const step of contract.steps) {
        for (const id of step.failureModesPrevented) {
          expect(canonicalIds.has(id)).toBe(true);
        }
      }
    }
  });
});
