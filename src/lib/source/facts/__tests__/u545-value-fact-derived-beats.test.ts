// ─────────────────────────────────────────────────────────────────────────────
// Item U-545 — the TERMINAL stage's intake beats and gate confirmations,
// derived from this event's realized-value signal instead of carried from
// `SAMPLE_VALUE_STAGE`.
//
// WHY THESE ASSERTIONS ARE SHAPED THIS WAY.
//
// Every count marker is asserted with `toBe` or an ANCHORED regex, never
// `toContain`: `toContain('1 of 6')` passes on `11 of 6` and on `1 of 60`, so a
// marker assertion written that way cannot distinguish the number it is about
// from a prefix extension of it. `U-542` recorded that trap and this suite
// inherits the rule rather than rediscovering it.
//
// THE SIGNAL HAS THREE STATES and collapsing any two is the defect the item
// names ("a lever with no realized row is NOT-YET-REALIZED and must render as
// that, never as zero and never as a guess"):
//   • `undefined`  — no realized fact has been observed for this event at all;
//   • `new Map()`  — realization WAS measured and no lever has realized yet;
//   • a populated map — some levers realized, and every other declared lever is
//     NOT YET REALIZED, which is not the same as realizing nothing.
//
// TERMINALITY IS READ, NOT RESTATED. `U-406` states the terminal gate contract
// once in `stage-terminal-contract.ts`. This suite asserts the derived gate
// carries that contract's own values — approver role, absent onward target,
// outcome sentence — and asserts the invented onward target the exemplar used to
// hand every consumer (`'Closed'`) is nowhere on the built view.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { SAMPLE_VALUE_STAGE } from '@/components/source/canvas/analytics/sample-view-model';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import { buildLiveStageView } from '@/lib/source/facts/view/stage-analytics-builder';
import { buildModeGrounding } from '@/lib/source/ava/mode-grounding';
import {
  SOURCE_TERMINAL_GATE_CONTRACT,
  TERMINAL_SOURCE_STAGE_KEY,
} from '@/lib/source/stage-terminal-contract';
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
  realizedValueByLeverKey?: ReadonlyMap<string, number>,
): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs: firstRuleFacts(archetype),
    citations: {},
    archetypeId: archetype.id,
    // Read from the canonical order, not typed: appending a stage after this one
    // must move this suite's subject rather than leave it pinned to `'value'`.
    stageKey: TERMINAL_SOURCE_STAGE_KEY,
    realizedValueByLeverKey,
  });
  expect(view).not.toBeNull();
  return view!;
}

const leverCount = ams.valueLeverRules!.length;
const firstLeverKey = ams.valueLeverRules![0].key;
const secondLeverKey = ams.valueLeverRules![1].key;

describe('U-545 terminal stage fact-derived beats', () => {
  it('has a population to assert over, so no case below passes over an empty set', () => {
    // Population before property. If the archetype lost its lever rules every
    // count assertion in this file would read 0 of 0 and still pass.
    expect(leverCount).toBeGreaterThan(1);
    expect(TERMINAL_SOURCE_STAGE_KEY).toBe('value');
    expect(SAMPLE_VALUE_STAGE.tasks).toHaveLength(1);
    // The exemplar content this item replaces, read off the exemplar so a
    // re-spelling there cannot leave the negatives below green against prose the
    // builder no longer emits.
    expect(SAMPLE_VALUE_STAGE.gate.confirms).toHaveLength(3);
    expect(SAMPLE_VALUE_STAGE.gate.confirms[0].label).toBe(
      'Realized value booked per lever',
    );
  });

  it('declares both intake beats derived and stops carrying the exemplar', () => {
    const view = build();
    expect(view.beatProvenance).toEqual({
      tasks: 'fact_derived',
      gate: 'fact_derived',
      scaffoldSource: null,
    });
    expect(view.tasks).not.toEqual(SAMPLE_VALUE_STAGE.tasks);
    expect(view.gate.confirms).not.toEqual(SAMPLE_VALUE_STAGE.gate.confirms);
  });

  it('carries none of the exemplar confirmation labels, on any of the three states', () => {
    /*
     * The mutation direction the item names: "reinstating the exemplar's
     * confirmation labels must go red naming the stage". Asserted over all three
     * signal states, because a partial reinstatement that only shows on the
     * unobserved branch would otherwise pass.
     */
    const exemplarLabels = SAMPLE_VALUE_STAGE.gate.confirms.map((c) => c.label);
    expect(exemplarLabels).toHaveLength(3);
    for (const state of [
      undefined,
      new Map<string, number>(),
      new Map([[firstLeverKey, 3_100_000]]),
    ]) {
      const view = build(ams, state);
      const labels = view.gate.confirms.map((c) => c.label);
      for (const exemplarLabel of exemplarLabels) {
        expect(labels).not.toContain(exemplarLabel);
      }
      // The exemplar's task title must not survive either.
      expect(view.tasks.map((task) => task.title)).not.toContain(
        SAMPLE_VALUE_STAGE.tasks[0].title,
      );
    }
  });

  it('never reads an unobserved realization signal as nothing realized', () => {
    const noSignal = build();
    const measuredAndEmpty = build(ams, new Map());

    // ANCHORED, and exact: the whole label, not a substring of it.
    expect(noSignal.gate.confirms[0].label).toBe(
      `No realized value observed on ${leverCount} declared levers`,
    );
    expect(measuredAndEmpty.gate.confirms[0].label).toBe(
      `0 of ${leverCount} levers carry a realized-value figure`,
    );
    expect(noSignal.gate.confirms[0].label).not.toBe(
      measuredAndEmpty.gate.confirms[0].label,
    );
    expect(noSignal.gate.confirms[0].detail).not.toBe(
      measuredAndEmpty.gate.confirms[0].detail,
    );
    // Neither state may present a dollar figure it has not read.
    expect(noSignal.gate.confirms.map((c) => `${c.label} ${c.detail}`).join(' ')).not.toMatch(
      /\$0\b/,
    );
    expect(noSignal.tasks.map((t) => `${t.subtitle} ${t.guide}`).join(' ')).not.toMatch(
      /\$0\b/,
    );
    /*
     * MEASURED, and it corrected what this case first asserted. The first draft
     * forbade `$0` on the measured-and-empty gate too, and that is wrong in a way
     * worth stating: once realization HAS been measured, `$0 realized to date` is
     * a real reportable zero, and `selection-fact-beats` already established that
     * reading on the sibling signal. The rule the item states is about a LEVER
     * ("a lever with no realized row is NOT-YET-REALIZED ... never as zero"), not
     * about the aggregate, so the negative belongs on the per-lever beats and the
     * aggregate gets an exact positive instead.
     */
    expect(measuredAndEmpty.gate.confirms[1].label).toMatch(
      /^\$0 realized to date · target \$[\d,]+–\$[\d,]+$/,
    );
    // The unobserved state must NOT be able to reach that label.
    expect(noSignal.gate.confirms[1].label).not.toMatch(/realized to date/);
    expect(noSignal.gate.confirms[1].label).toMatch(
      /^No realization measured · target \$[\d,]+–\$[\d,]+$/,
    );
    // And no per-lever beat renders an absence as zero, in either observed state.
    expect(
      measuredAndEmpty.tasks.map((t) => `${t.subtitle} ${t.guide}`).join(' '),
    ).not.toMatch(/\$0\b/);

    // The three-way split reaches the task list too, not only the gate.
    expect(noSignal.tasks).toHaveLength(1);
    expect(noSignal.tasks[0].id).toBe('value.realized-actuals');
    expect(noSignal.tasks[0].factTemplateCode).toBe('VALUE_REALIZATION_V1');
    expect(measuredAndEmpty.tasks).toHaveLength(leverCount);
    expect(
      measuredAndEmpty.tasks.every((task) =>
        task.id.startsWith('value.not-yet-realized.'),
      ),
    ).toBe(true);
  });

  it('moves task and gate with observed realized-value facts', () => {
    const missing = build();
    const observed = build(ams, new Map([[firstLeverKey, 3_100_000]]));

    expect(observed.tasks).not.toEqual(missing.tasks);
    expect(observed.gate.confirms).not.toEqual(missing.gate.confirms);
    expect(observed.gate.confirms[0].label).toBe(
      `1 of ${leverCount} levers carry a realized-value figure`,
    );
    expect(observed.gate.confirms[1].label).toMatch(/^\$3,100,000 realized to date\b/);

    // A second realization moves the same two markers again, so the labels are
    // measured rather than two hand-written strings behind a boolean.
    const twoObserved = build(
      ams,
      new Map([[firstLeverKey, 3_100_000], [secondLeverKey, 900_000]]),
    );
    expect(twoObserved.gate.confirms[0].label).toBe(
      `2 of ${leverCount} levers carry a realized-value figure`,
    );
    expect(twoObserved.gate.confirms[1].label).toMatch(/^\$4,000,000 realized to date\b/);
  });

  it('shows an unrealized lever as not yet realized, per lever and never as zero', () => {
    const observed = build(ams, new Map([[firstLeverKey, 3_100_000]]));
    const notYet = observed.tasks.filter((task) =>
      task.id.startsWith('value.not-yet-realized.'),
    );
    // PER LEVER, never a count: one beat for each declared lever with no row.
    expect(notYet).toHaveLength(leverCount - 1);
    const leverNames = new Set(
      ams.valueLeverRules!.slice(1).map((rule) => rule.name),
    );
    for (const task of notYet) {
      expect([...leverNames].some((name) => task.title.includes(name))).toBe(true);
    }
    const notYetProse = notYet
      .map((task) => `${task.title} ${task.subtitle} ${task.guide}`)
      .join(' ');
    expect(notYetProse).toMatch(/not yet realized/i);
    expect(notYetProse).not.toMatch(/\$0\b/);

    // The realized lever gets a confirm task carrying its own figure.
    const realized = observed.tasks.filter((task) =>
      task.id.startsWith('value.realized.'),
    );
    expect(realized).toHaveLength(1);
    expect(realized[0].rows).toContainEqual(
      expect.objectContaining({ key: 'Realized to date', value: '$3,100,000' }),
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

  it('reads the terminal gate contract rather than restating it', () => {
    const view = build();
    expect(view.gate.approver).toBe(SOURCE_TERMINAL_GATE_CONTRACT.approverRole);
    expect(view.gate.nextStageName).toBe(SOURCE_TERMINAL_GATE_CONTRACT.nextStageName);
    expect(view.gate.nextStageName).toBeNull();
    // The contract's own sentence, verbatim — one phrasing, not a second.
    const gateProse = view.gate.confirms
      .map((confirm) => `${confirm.label} ${confirm.detail}`)
      .join(' ');
    expect(gateProse).toContain(SOURCE_TERMINAL_GATE_CONTRACT.outcomeSentence);
    // The invented onward target the exemplar used to carry reaches nothing.
    expect(JSON.stringify(view)).not.toMatch(/"Closed"/);
    expect(gateProse).not.toMatch(/advance to/i);
  });

  it('takes the deliverables from the archetype, not the exemplar', () => {
    const amsView = build();
    const renewalView = build(renewal);
    // No rule-bearing archetype declares a terminal-stage deliverable today, so
    // the honest answer is none — and the exemplar's `d12` code chip, an internal
    // identifier, must not reach a client surface.
    expect(amsView.gate.generates).toEqual(
      ams.deliverablePack
        .filter((item) => item.stage === TERMINAL_SOURCE_STAGE_KEY)
        .map((item) => ({ label: item.label })),
    );
    expect(renewalView.gate.generates).toEqual(
      renewal.deliverablePack
        .filter((item) => item.stage === TERMINAL_SOURCE_STAGE_KEY)
        .map((item) => ({ label: item.label })),
    );
    expect(amsView.gate.generates).not.toEqual(SAMPLE_VALUE_STAGE.gate.generates);
    expect(JSON.stringify(amsView.gate.generates)).not.toMatch(/d12/);
  });

  it('moves the beats with the ARCHETYPE, not only with the facts', () => {
    // A hand-written alternative to a fixture is still a fixture. The declared
    // levers differ between these two archetypes, so a derived beat list must
    // differ too.
    const amsView = build(ams, new Map());
    const renewalView = build(renewal, new Map());
    expect(amsView.tasks).toHaveLength(ams.valueLeverRules!.length);
    expect(renewalView.tasks).toHaveLength(renewal.valueLeverRules!.length);
    expect(amsView.tasks.map((t) => t.id)).not.toEqual(
      renewalView.tasks.map((t) => t.id),
    );
    expect(amsView.gate.confirms[0].label).not.toBe(
      renewalView.gate.confirms[0].label,
    );
  });

  it('stops disclosing carried beats to the model on this stage, in both modes', () => {
    /*
     * The grounding block is the second destination `U-533` established, and the
     * one that mattered most: the carried exemplar reached the MODEL, which was
     * told a fixture's task titles and its approver were authoritative. The
     * disclosure must come off now that the beats are derived.
     */
    const marker = /^SCAFFOLD CONTENT -- /m;
    const view = build(ams, new Map([[firstLeverKey, 3_100_000]]));
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

    // Population: the block really was produced, so the negatives are not
    // vacuous over an empty string.
    expect(block('stage_gate').length).toBeGreaterThan(0);
    expect(block('evidence_readiness').length).toBeGreaterThan(0);
    expect(block('evidence_readiness')).not.toMatch(marker);
    expect(block('stage_gate')).not.toMatch(marker);
    // And the exemplar's own confirm label does not reach the model either.
    expect(block('stage_gate')).not.toContain(
      SAMPLE_VALUE_STAGE.gate.confirms[0].label,
    );
  });

  it('wires the tenant-scoped realized-value signal into the mounted live stage builder', () => {
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
          property.name.text === 'realizedValueByLeverKey',
      ),
    ).toBe(true);
  });
});
