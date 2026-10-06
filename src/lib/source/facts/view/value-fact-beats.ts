// ─────────────────────────────────────────────────────────────────────────────
// Item U-545 — the TERMINAL stage's intake beats, derived from this event's
// realized-value signal instead of carried from `SAMPLE_VALUE_STAGE`.
//
// WHY THIS STAGE, AND WHY NOW. `U-542` measured that exactly two of the six
// stages still carrying exemplar beats had a dedicated tenant-scoped per-lever
// fact signal already READ at the live call site — `selection`
// (`readCommittedValueLevers`) and this one (`readRealizedValueLevers`) — and
// took `selection`, declining this stage for a stated reason: it is the final
// entry in `SOURCE_STAGE_ORDER`, so its gate has no advance target and "what a
// terminal gate should say is a product decision rather than a derivation".
// `U-406` then made that decision and stated it once, in
// `stage-terminal-contract.ts`. So the blocker `U-542` named is gone, and what
// is left is the derivation.
//
// The signal was already fetched on this stage and handed to `buildStepInsight`
// and NOT to `buildLiveStageView` — the same one-function-short defect
// `U-542` found on `selection`. This module needs no new read.
//
// WHAT "FACT-DERIVED" HAS TO MEAN HERE. Not "different from the exemplar" — a
// hand-written alternative to a fixture is still a fixture. Every value below is
// read from something that MOVES: the caller's `realizedByLeverKey` signal; the
// evaluator's own `ValueLeverResult[]` for this event's facts (the target band
// realization is read against); the caller's `citations`, so a confirmed number
// names the document it was read from; and the resolved archetype's own
// declarations (its lever rules, its `deliverablePack` at this stage).
//
// THE SIGNAL HAS THREE STATES, NOT TWO, and collapsing any two of them is the
// defect this module exists to avoid:
//
//   • `undefined`   — no realized fact has been observed for this event at all.
//                     The honest beat is a request for the actuals, NOT a report
//                     that nothing realized.
//   • `new Map()`   — realization WAS measured and no lever has realized yet.
//   • a populated map — some levers realized; every other declared lever is NOT
//                     YET REALIZED, which is not a realization of $0.
//
// PER LEVER, NEVER A COUNT. The item's acceptance is explicit: "a lever with no
// realized row is NOT-YET-REALIZED and must render as that, never as zero and
// never as a guess". So the unrealized levers each get their own beat naming the
// lever, rather than one beat reporting how many are outstanding — a count
// cannot be acted on and hides which lever is leaking.
//
// TERMINALITY IS READ, NOT RESTATED. `U-406`'s closing note is that "a second
// phrasing at the surface is the defect U-406 closed", so the approver role, the
// absent onward target and the outcome sentence are read from
// `SOURCE_TERMINAL_GATE_CONTRACT` rather than written again here.
// `withTerminalGateContract` re-applies the first two at the builder boundary;
// this module agreeing with the contract by reading it is what makes that
// re-application a no-op instead of a correction.
//
// It deliberately reads NOTHING from `SAMPLE_VALUE_STAGE`. In particular the
// exemplar's `generates` entry carries a `d12` artifact code, and a
// `DeliverableSpec.key` is an internal identifier a reader on a client surface
// should not be shown — so `generates` is the archetype's own declared
// deliverables at this stage, which today is none on every rule-bearing
// archetype. Empty is the honest answer, not a reason to keep the fixture.
//
// This module DERIVES; it does not declare. `buildLiveStageView` stays the only
// thing that decides a view's provenance (the `U-533` boundary rule), so nothing
// here writes `beatProvenance`.
//
// The four small formatters below are a fourth copy of helpers `bafo-`,
// `evaluation-` and `selection-fact-beats` each hold privately. Copied rather
// than extracted deliberately: the extraction touches three modules this item
// does not own, and a bounded change reviewed properly is the point of this
// backlog. Filed as its own item rather than folded in here.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SourceEventArchetype,
  ValueLeverRule,
} from '@/lib/source/archetypes/types';
import {
  citedDocFor,
  idSegment,
  targetBandFor,
  targetLabel,
  usd,
} from '@/lib/source/facts/view/stage-beat-formatters';
import type { ValueLeverResult } from '@/lib/source/facts/evaluators/types';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';
import {
  SOURCE_TERMINAL_GATE_CONTRACT,
  TERMINAL_SOURCE_STAGE_KEY,
} from '@/lib/source/stage-terminal-contract';
import type {
  GateConfirmView,
  GateDeliverableView,
  StageGateView,
  StageTaskView,
  TaskReviewRowView,
} from '@/components/source/canvas/analytics/view-model';

/**
 * The stage this module builds. Read from the canonical order through the
 * terminal contract rather than typed as `'value'`, so appending a stage after it
 * moves this module's subject with it instead of leaving a hand-typed key to
 * drift — the same reason `TERMINAL_SOURCE_STAGE_KEY` exists.
 */
export const VALUE_STAGE_KEY: string = TERMINAL_SOURCE_STAGE_KEY;

/**
 * The fact template the realized-value upload is parsed through. Kept equal to
 * the exemplar's code because the code names a REAL parser
 * (`VALUE_REALIZATION_V1` → `realized_value_usd` `value_lever` facts) rather than
 * exemplar copy — deriving a different one would break the upload.
 */
const VALUE_REALIZATION_TEMPLATE_CODE = 'VALUE_REALIZATION_V1';

export interface ValueFactBeatInput {
  /** The archetype resolved for this event — the source of the lever rules. */
  archetype: SourceEventArchetype;
  /** The evaluator's per-lever verdicts, giving each lever its target band. */
  leverResults: readonly ValueLeverResult[];
  /** factKey → citation, so a confirmed number names the document it came from. */
  citations: Record<string, FactSourceCitation | null>;
  /**
   * leverKey → realized-to-date USD, from `readRealizedValueLevers`.
   * `undefined` means NO realized fact has been observed — not that nothing has
   * realized. An empty map means realization was measured and nothing has
   * realized yet.
   */
  realizedByLeverKey?: ReadonlyMap<string, number>;
}

/**
 * The realization read for this event, resolved against the archetype's DECLARED
 * levers.
 *
 * Only a lever the archetype declares can carry a realized figure: a key the
 * signal names that no rule declares is not counted and is not surfaced, because
 * a stray `entity_ref` from another archetype's template would otherwise inflate
 * the realization count on this gate and print a foreign identifier on a client
 * surface.
 */
function realizationRead(input: ValueFactBeatInput) {
  const rules: readonly ValueLeverRule[] = input.archetype.valueLeverRules ?? [];
  const resultByKey = new Map(
    input.leverResults.map((result) => [result.key, result]),
  );
  const observed = input.realizedByLeverKey !== undefined;

  const levers = rules.map((rule) => {
    const result = resultByKey.get(rule.key);
    const realized = observed
      ? input.realizedByLeverKey!.get(rule.key)
      : undefined;
    return {
      rule,
      result,
      band: targetBandFor(result),
      cited: citedDocFor(result, input.citations),
      realized,
    };
  });

  const realizedLevers = levers.filter((lever) => lever.realized !== undefined);
  const notYetLevers = levers.filter((lever) => lever.realized === undefined);
  const realizedTotal = realizedLevers.reduce(
    (sum, lever) => sum + (lever.realized ?? 0),
    0,
  );
  const targetLow = levers.reduce((sum, lever) => sum + (lever.band?.low ?? 0), 0);
  const targetHigh = levers.reduce((sum, lever) => sum + (lever.band?.high ?? 0), 0);

  return {
    observed,
    levers,
    realizedLevers,
    notYetLevers,
    realizedTotal,
    targetLow,
    targetHigh,
    total: rules.length,
  };
}

type RealizationRead = ReturnType<typeof realizationRead>;
type RealizationLever = RealizationRead['levers'][number];

/**
 * The single beat for the un-observed state: ask for the actuals, with one row
 * per declared lever and its target band, so the request itself carries the
 * event's own levers rather than a fixture checklist.
 */
function requestActualsTask(read: RealizationRead): StageTaskView {
  const rows: TaskReviewRowView[] = read.levers.map((lever) => ({
    key: lever.rule.name,
    value: `Target ${targetLabel(lever.band)} · no realized figure read`,
    flag: true,
  }));

  return {
    id: 'value.realized-actuals',
    title: 'Provide the realized-value actuals',
    subtitle: `${read.total} declared lever${read.total === 1 ? '' : 's'} · no realized fact read yet`,
    type: 'provide',
    state: 'todo',
    guide:
      'Upload the realized-value actuals (one row per value lever, keyed by lever key, with the cumulative realized-to-date value ' +
      'for that lever over the contract term — not annualized and not per-period). No realized fact has been read for this event ' +
      'yet, so nothing below is a claim that a lever has realized nothing — it is a claim that nothing has been read.',
    // MEASURED. The first draft built these rows and did not return them, so this
    // beat carried no per-lever content at all and the U-533 provenance harness
    // read `tasks` as moving with the archetype but NOT with the facts — which is
    // exactly what a beat that names the levers and drops their target bands
    // would look like. Nothing else noticed: the rows were assigned to a local
    // the object literal simply never mentioned.
    rows,
    provenance: {
      // The role that supplies the realization record, matching the sibling
      // derived stages' `provenance.owner`. The DECIDING role on this stage is the
      // gate's approver and comes from the terminal contract; this is the
      // providing role, which neither the contract nor the archetype declares.
      owner: 'Value realization lead',
      source: 'Run-cost / SLA-credit / productivity actuals record',
    },
    cta: 'Provide the realized-value actuals',
    factTemplateCode: VALUE_REALIZATION_TEMPLATE_CODE,
  };
}

/** One `confirm` task per lever the realization read actually carries a figure for. */
function realizedTaskFor(lever: RealizationLever): StageTaskView {
  const rows: TaskReviewRowView[] = [
    { key: 'Realized to date', value: usd(lever.realized ?? 0) },
    { key: 'Target band', value: targetLabel(lever.band) },
    {
      key: 'Cited to',
      value: lever.cited ?? 'No citation on the consumed facts',
      flag: lever.cited === null,
    },
  ];

  return {
    id: `value.realized.${idSegment(lever.rule.key)}`,
    title: `Confirm the realized value on ${lever.rule.name}`,
    subtitle: `${usd(lever.realized ?? 0)} realized to date · target ${targetLabel(lever.band)}`,
    type: 'confirm',
    state: 'todo',
    guide:
      `The realization record carries ${usd(lever.realized ?? 0)} against this lever. Confirm that figure is the one the ` +
      `actuals support — a realized figure confirmed here that the actuals do not carry turns the event's value story into a ` +
      `claim nobody can falsify, which is the failure this stage exists to prevent.`,
    rows,
    cta: 'Confirm the realized value',
  };
}

/**
 * One `provide` task per declared lever the realization read carries NO figure
 * for.
 *
 * The wording is "not yet realized", never "$0 realized". The signal being
 * present says realization was measured; it does not say this lever produced
 * nothing.
 */
function notYetRealizedTaskFor(lever: RealizationLever): StageTaskView {
  const rows: TaskReviewRowView[] = [
    { key: 'Target band', value: targetLabel(lever.band) },
    { key: 'Realized to date', value: 'Not yet realized', flag: true },
  ];

  return {
    id: `value.not-yet-realized.${idSegment(lever.rule.key)}`,
    title: `Record the realized value for ${lever.rule.name}`,
    subtitle: `Not yet realized · target ${targetLabel(lever.band)}`,
    type: 'provide',
    state: 'todo',
    guide:
      'The realization read for this event carries no figure against this lever. That is not yet realized, not a realization of ' +
      'nothing — record the realized-to-date value the actuals support, or state why this lever has not begun to realize. ' +
      `${lever.rule.commercialRisk ?? 'An unmeasured lever is value that quietly reverts to the incumbent run-rate.'}`,
    rows,
    cta: 'Record the realized value',
    factTemplateCode: VALUE_REALIZATION_TEMPLATE_CODE,
  };
}

/**
 * The terminal task checklist for this event.
 *
 * Un-observed → one request beat. Observed → the realized levers first (in
 * archetype rule order), then the levers not yet realized. Order is
 * deterministic, so the same facts always produce the same list.
 */
export function buildValueFactDerivedTasks(
  input: ValueFactBeatInput,
): readonly StageTaskView[] {
  const read = realizationRead(input);
  if (!read.observed) return [requestActualsTask(read)];
  return [
    ...read.realizedLevers.map((lever) => realizedTaskFor(lever)),
    ...read.notYetLevers.map((lever) => notYetRealizedTaskFor(lever)),
  ];
}

/**
 * The confirm boxes, stated from the realization read so every label carries a
 * measured count or a measured magnitude. Three boxes, because the gate reads as
 * three attestations — and the third is the completion review itself, read from
 * the terminal contract rather than phrased again.
 */
function valueGateConfirms(
  input: ValueFactBeatInput,
): readonly GateConfirmView[] {
  const read = realizationRead(input);

  const coverage: GateConfirmView = read.observed
    ? {
        label: `${read.realizedLevers.length} of ${read.total} levers carry a realized-value figure`,
        detail:
          read.notYetLevers.length > 0
            ? `${read.notYetLevers.length} declared lever${read.notYetLevers.length === 1 ? ' is' : 's are'} not yet realized and ` +
              `${read.notYetLevers.length === 1 ? 'is' : 'are'} not realizing nothing: ` +
              `${read.notYetLevers.map((lever) => lever.rule.name).join('; ')}.`
            : 'Every declared lever carries a realized-to-date figure read from the realization record.',
      }
    : {
        /*
         * MEASURED, and the U-533 provenance harness corrected the first draft of
         * this branch. It read `'No realized value observed'` with a static
         * detail, and the harness — which builds this stage with NO realized
         * signal, so this is the branch it sees — classified `gate.confirms` as
         * `derived_from_neither`: content that differs from the exemplar and
         * follows neither the facts nor the archetype, which is the shape of a
         * hand-written replacement for a fixture. The absence of a realized fact
         * is not an absence of measurable content: the event's own declared lever
         * count is real, and naming it is what makes "nothing has been read" a
         * specific claim rather than a slogan.
         */
        label: `No realized value observed on ${read.total} declared lever${read.total === 1 ? '' : 's'}`,
        detail:
          'No realized fact has been read for this event, so no lever on this gate is confirmed either way. ' +
          'This is an unread realization, not a realization that produced nothing. Declared levers awaiting a first ' +
          `realized figure: ${read.levers.map((lever) => lever.rule.name).join('; ')}.`,
      };

  const magnitude: GateConfirmView = read.observed
    ? {
        label: `${usd(read.realizedTotal)} realized to date · target ${targetLabel(
          read.targetLow === 0 && read.targetHigh === 0
            ? null
            : { low: read.targetLow, high: read.targetHigh },
        )}`,
        detail:
          `This realized total sums only the ${read.realizedLevers.length} lever${read.realizedLevers.length === 1 ? '' : 's'} ` +
          'the realization record actually carries a figure for; no lever that has not yet realized is counted as zero. ' +
          'The target band is this event’s own computed value range, so the gap between the two is the leakage still open.',
      }
    : {
        // Same correction as the box above, on the other reading: the target band
        // is computed from this event's own facts and is real whether or not
        // anything has realized, so the box states what realization will be
        // measured AGAINST rather than only that it has not been measured.
        label: `No realization measured · target ${targetLabel(
          read.targetLow === 0 && read.targetHigh === 0
            ? null
            : { low: read.targetLow, high: read.targetHigh },
        )}`,
        detail:
          'Realization is measured against the value this event computed from its own committed facts. Until the actuals are ' +
          'read there is nothing to measure against that target, and any statement about realized value would be unfalsifiable.',
      };

  /**
   * The completion review. The sentence is the contract's own — U-406 states the
   * terminal decision once, and a second phrasing at the surface is the defect it
   * closed.
   */
  const completion: GateConfirmView = {
    label: SOURCE_TERMINAL_GATE_CONTRACT.decisionLabel,
    detail: SOURCE_TERMINAL_GATE_CONTRACT.outcomeSentence,
  };

  return [coverage, magnitude, completion];
}

/**
 * What generates on approval: the archetype's own deliverables at this stage.
 *
 * No `code` chip. A `DeliverableSpec.key` is an internal identifier, and a reader
 * on a client surface should not be shown one — so the label goes out and the key
 * stays in. No rule-bearing archetype declares a terminal-stage deliverable
 * today, so this is empty, and empty is the honest answer.
 */
function valueGateGenerates(
  archetype: SourceEventArchetype,
): readonly GateDeliverableView[] {
  return archetype.deliverablePack
    .filter((deliverable) => deliverable.stage === VALUE_STAGE_KEY)
    .map((deliverable) => ({ label: deliverable.label }));
}

/**
 * The terminal gate for this event, derived.
 *
 * `approver` and `nextStageName` are READ from the terminal contract, not chosen
 * here. `withTerminalGateContract` applies the same two values at the builder
 * boundary, so this module agreeing with the contract is what keeps that
 * application a no-op rather than a silent correction of a derived gate.
 */
export function buildValueFactDerivedGate(
  input: ValueFactBeatInput,
): StageGateView {
  return {
    approver: SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    confirms: valueGateConfirms(input),
    generates: valueGateGenerates(input.archetype),
    nextStageName: SOURCE_TERMINAL_GATE_CONTRACT.nextStageName,
  };
}
