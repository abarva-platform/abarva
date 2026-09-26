// ─────────────────────────────────────────────────────────────────────────────
// Item U-542 — the Selection stage's intake beats, derived from this event's
// committed-value award signal instead of carried from `SAMPLE_SELECTION_STAGE`.
//
// WHY THESE ASSERTIONS ARE SHAPED THIS WAY.
//
// Every count marker below is asserted with `toBe` or an ANCHORED regex, never
// `toContain`. `toContain('1 of 6')` passes on `11 of 6` and on `1 of 60`, so a
// marker assertion written that way cannot distinguish the number it is about
// from a prefix extension of it. The acceptance for this item names that trap
// explicitly, and two sibling suites use `toContain` on exactly this shape.
//
// The three-way signal split is the substance of the item, so each state is
// asserted against the OTHER TWO rather than only against the exemplar:
//   • `undefined`  — no award fact has been observed at all;
//   • `new Map()`  — the award was assessed and no lever committed;
//   • a populated map — some levers committed, and the rest are AWAITING award.
// Collapsing any two of those three is the failure mode a live surface would
// show as "0 committed" when the truth is "nothing has been read yet".
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { SAMPLE_SELECTION_STAGE } from '@/components/source/canvas/analytics/sample-view-model';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import { buildLiveStageView } from '@/lib/source/facts/view/stage-analytics-builder';
import { buildModeGrounding } from '@/lib/source/ava/mode-grounding';
import type { StageAnalyticsView } from '@/components/source/canvas/analytics/view-model';
import type { SourceEventArchetype } from '@/lib/source/archetypes/types';

const ams = getSourceArchetype('AMS_MANAGED_SERVICES')!;
const renewal = getSourceArchetype('CONTRACT_RENEWAL')!;

/** Facts that make the archetype's FIRST lever compute, so the builder goes live. */
function firstRuleFacts(archetype: SourceEventArchetype): Record<string, number> {
  return Object.fromEntries(
    archetype.valueLeverRules![0].computation.inputs.map((input) => [
      input.key,
      input.unit === 'pct' ? 20 : input.unit === 'count' ? 3 : 1_000_000,
    ]),
  );
}

function build(
  archetype: SourceEventArchetype = ams,
  committedValueByLeverKey?: ReadonlyMap<string, number>,
): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs: firstRuleFacts(archetype),
    citations: {},
    archetypeId: archetype.id,
    stageKey: 'selection',
    committedValueByLeverKey,
  });
  expect(view).not.toBeNull();
  return view!;
}

const leverCount = ams.valueLeverRules!.length;
const firstLeverKey = ams.valueLeverRules![0].key;
const secondLeverKey = ams.valueLeverRules![1].key;

describe('U-542 Selection stage fact-derived beats', () => {
  it('has a population to assert over, so no case below passes over an empty set', () => {
    // Population before property. If the archetype lost its lever rules every
    // count assertion in this file would read 0 of 0 and still pass.
    expect(leverCount).toBeGreaterThan(1);
    expect(SAMPLE_SELECTION_STAGE.tasks).toHaveLength(1);
    expect(SAMPLE_SELECTION_STAGE.gate.approver).toBe('Commercial owner');
  });

  it('declares both intake beats derived and stops carrying the exemplar', () => {
    const view = build();
    expect(view.beatProvenance).toEqual({
      tasks: 'fact_derived',
      gate: 'fact_derived',
      scaffoldSource: null,
    });
    expect(view.tasks).not.toEqual(SAMPLE_SELECTION_STAGE.tasks);
    expect(view.gate.confirms).not.toEqual(SAMPLE_SELECTION_STAGE.gate.confirms);
    // The exemplar's own confirm prose must not survive anywhere on the gate.
    const gateProse = view.gate.confirms
      .map((confirm) => `${confirm.label} ${confirm.detail}`)
      .join(' ');
    expect(gateProse).not.toMatch(/every priced lever carried into the award/i);
    expect(gateProse).not.toMatch(/award final/i);
  });

  it('never reads an unobserved award signal as nothing committed', () => {
    const noSignal = build();
    const assessedAndEmpty = build(ams, new Map());

    // ANCHORED, and exact: the whole label, not a substring of it.
    expect(noSignal.gate.confirms[0].label).toBe('No award commitments observed');
    expect(assessedAndEmpty.gate.confirms[0].label).toBe(
      `0 of ${leverCount} levers carried a committed value into the award`,
    );
    expect(noSignal.gate.confirms[0].label).not.toBe(
      assessedAndEmpty.gate.confirms[0].label,
    );
    expect(noSignal.gate.confirms[0].detail).not.toBe(
      assessedAndEmpty.gate.confirms[0].detail,
    );
    // Neither state may present a dollar figure it has not read.
    expect(noSignal.gate.confirms.map((c) => c.detail).join(' ')).not.toMatch(/\$0\b/);
    expect(noSignal.tasks.map((t) => t.subtitle).join(' ')).not.toMatch(/\$0\b/);
    expect(noSignal.gate.confirms[1].label).toBe('No committed baseline set');
    expect(assessedAndEmpty.gate.confirms[1].label).toMatch(/^\$0 committed at award\b/);

    // The THREE-WAY split reaches the task list too, not only the gate: an
    // unread award asks for the commitments; an assessed-and-empty award reports
    // every declared lever as awaiting award. Two hand-written strings behind one
    // boolean would pass the gate assertions above and fail these.
    expect(noSignal.tasks).toHaveLength(1);
    expect(noSignal.tasks[0].id).toBe('selection.award-commitments');
    expect(noSignal.tasks[0].factTemplateCode).toBe('COMMITTED_VALUE_V1');
    expect(assessedAndEmpty.tasks).toHaveLength(leverCount);
    expect(
      assessedAndEmpty.tasks.every((task) =>
        task.id.startsWith('selection.awaiting-award.'),
      ),
    ).toBe(true);
  });

  it('moves task and gate with observed committed-value facts', () => {
    const missing = build();
    const observed = build(ams, new Map([[firstLeverKey, 4_200_000]]));

    expect(observed.tasks).not.toEqual(missing.tasks);
    expect(observed.gate.confirms).not.toEqual(missing.gate.confirms);
    expect(observed.gate.confirms[0].label).toBe(
      `1 of ${leverCount} levers carried a committed value into the award`,
    );
    // The committed magnitude is read, and it is the number that was provided.
    expect(observed.gate.confirms[1].label).toMatch(/^\$4,200,000 committed at award\b/);
    // A second commitment moves the same two markers again, so the labels are
    // measured rather than two hand-written strings behind a boolean.
    const twoObserved = build(
      ams,
      new Map([[firstLeverKey, 4_200_000], [secondLeverKey, 800_000]]),
    );
    expect(twoObserved.gate.confirms[0].label).toBe(
      `2 of ${leverCount} levers carried a committed value into the award`,
    );
    expect(twoObserved.gate.confirms[1].label).toMatch(/^\$5,000,000 committed at award\b/);
  });

  it('shows an uncommitted lever as awaiting award, never as zero committed', () => {
    const observed = build(ams, new Map([[firstLeverKey, 4_200_000]]));
    const awaiting = observed.tasks.filter((task) =>
      task.id.startsWith('selection.awaiting-award.'),
    );
    expect(awaiting).toHaveLength(leverCount - 1);
    const awaitingProse = awaiting
      .map((task) => `${task.title} ${task.subtitle} ${task.guide}`)
      .join(' ');
    expect(awaitingProse).toMatch(/awaiting award/i);
    expect(awaitingProse).not.toMatch(/\$0\b/);
    // The committed lever gets a confirm task carrying its own figure.
    const committed = observed.tasks.filter((task) =>
      task.id.startsWith('selection.committed.'),
    );
    expect(committed).toHaveLength(1);
    expect(committed[0].rows).toContainEqual(
      expect.objectContaining({ key: 'Committed at award', value: '$4,200,000' }),
    );
  });

  it('does not count a lever key the archetype never declared', () => {
    const foreign = build(ams, new Map([['ANOTHER_ARCHETYPE.LEVER', 9_900_000]]));
    const empty = build(ams, new Map());
    expect(foreign.gate.confirms[0].label).toBe(empty.gate.confirms[0].label);
    const everything = JSON.stringify(foreign);
    expect(everything).not.toMatch(/ANOTHER_ARCHETYPE/);
    expect(everything).not.toMatch(/9,900,000/);
  });

  it('takes the approver role and the deliverables from the archetype, not the exemplar', () => {
    const amsView = build();
    const renewalView = build(renewal);
    expect(amsView.gate.approver).toBe(ams.requiredStakeholders[0]);
    expect(renewalView.gate.approver).toBe(renewal.requiredStakeholders[0]);
    expect(amsView.gate.approver).not.toBe(renewalView.gate.approver);
    expect(amsView.gate.approver).not.toBe(SAMPLE_SELECTION_STAGE.gate.approver);

    // `generates` is what the archetype declares AT THIS STAGE. No archetype
    // declares a Selection deliverable today, so the honest answer is none —
    // and the exemplar's `d11` code chip must not reach a client surface.
    expect(amsView.gate.generates).toEqual(
      ams.deliverablePack
        .filter((item) => item.stage === 'selection')
        .map((item) => ({ label: item.label })),
    );
    expect(amsView.gate.generates).not.toEqual(SAMPLE_SELECTION_STAGE.gate.generates);
    expect(JSON.stringify(amsView.gate.generates)).not.toMatch(/d11/);
  });

  it('keeps the gate pointing at the canonical next stage', () => {
    const view = build();
    expect(view.gate.nextStageName).toBe('Transition');
    expect(view.gate.confirms[2].detail).toMatch(/\bTransition\b/);
  });

  it('stops disclosing carried beats to the model on this stage, in both modes', () => {
    /*
     * The grounding block is the destination `U-533` was actually about: the
     * carried exemplar reached the MODEL, which called a fixture's task titles
     * and approver authoritative. So the disclosure must come off now that the
     * beats are derived.
     *
     * Asserted here because the two sibling suites assert the negative for ONE
     * stage each (`bafo` in U-534, `evaluation` in U-535) rather than over the
     * derived set, so `rfp`, `responses` and now `selection` were not covered by
     * either. This closes it for `selection` only; the two older stages are a
     * pre-existing gap and are not claimed as fixed here.
     */
    const marker = /^SCAFFOLD CONTENT -- /m;
    const view = build(ams, new Map([[firstLeverKey, 4_200_000]]));
    const block = (mode: 'evidence_readiness' | 'stage_gate') =>
      buildModeGrounding({
        mode,
        event: {
          code: 'EVT-1',
          name: 'Managed services renewal',
          currentStageKey: view.stageKey,
          blocker: null,
          nextAction: null,
        },
        viewStageKey: view.stageKey,
        stageView: view,
        factInputs: firstRuleFacts(ams),
        artifacts: [],
        question: 'what is the gate state?',
      }).block;

    // Population: the block really was produced and really does discuss this
    // stage, so the two negatives below are not vacuous over an empty string.
    expect(block('stage_gate').length).toBeGreaterThan(0);
    expect(block('evidence_readiness').length).toBeGreaterThan(0);
    expect(block('evidence_readiness')).not.toMatch(marker);
    expect(block('stage_gate')).not.toMatch(marker);
  });

  it('wires the tenant-scoped committed-value signal into the mounted live stage builder', () => {
    // The signal is ALREADY read on this stage and already passed to
    // `buildStepInsight`; the defect is that it stopped one function short of
    // `buildLiveStageView`. Asserted at the call site, because a module that
    // derives correctly and is never handed the signal derives nothing.
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/page.tsx'),
      'utf8',
    );
    const tree = ts.createSourceFile(
      'page.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const calls: ts.CallExpression[] = [];
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'buildLiveStageView'
      ) {
        calls.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
    expect(calls).toHaveLength(1);
    const argument = calls[0].arguments[0];
    expect(ts.isObjectLiteralExpression(argument)).toBe(true);
    expect(
      (argument as ts.ObjectLiteralExpression).properties.some(
        (property) =>
          ts.isShorthandPropertyAssignment(property) &&
          property.name.text === 'committedValueByLeverKey',
      ),
    ).toBe(true);
  });
});
