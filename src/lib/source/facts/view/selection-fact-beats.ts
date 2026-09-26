// ─────────────────────────────────────────────────────────────────────────────
// Item U-542 — the Selection stage's intake beats, derived from this event's
// award commitments instead of carried from `SAMPLE_SELECTION_STAGE`.
//
// WHY THIS STAGE, and it is a measurement rather than a preference. Of the six
// stages still carrying exemplar `tasks` and `gate` after `U-540`, exactly TWO
// already have a dedicated tenant-scoped per-lever fact signal READ at the live
// call site: `selection` (`readCommittedValueLevers` → `committed_value_usd`
// facts, keyed by lever key in `entity_ref`) and `value`
// (`readRealizedValueLevers`). The other four — `scope`, `pricing`,
// `executive_decision`, `transition` — have none, which is the same narrowing
// `U-540` recorded for `scope`. Both signals were already fetched on their own
// stage and handed to `buildStepInsight`, and NEITHER was handed to
// `buildLiveStageView`, so this stage needed no new read: the signal stopped one
// function short. `value` was not the pick because it is the final entry in
// `SOURCE_STAGE_ORDER`, so its gate has no advance target at all and what a
// terminal gate should say is a product decision rather than a derivation.
//
// WHAT "FACT-DERIVED" HAS TO MEAN HERE. Not "different from the exemplar" — a
// hand-written alternative to a fixture is still a fixture. Every value below is
// read from one of four things that MOVE: the caller's `committedByLeverKey`
// award signal; the evaluator's own `ValueLeverResult[]` for this event's facts
// (the target band each commitment is read against); the caller's `citations`,
// so a confirmed number names the document it was read from; and the resolved
// archetype's own declarations (its lever rules, its `deliverablePack` at this
// stage, its `requiredStakeholders`).
//
// THE SIGNAL HAS THREE STATES, NOT TWO, and collapsing any two of them is the
// defect this module exists to avoid:
//
//   • `undefined`   — no award fact has been observed for this event at all.
//                     The honest beat is a request for the commitments, NOT a
//                     report that nothing committed.
//   • `new Map()`   — the award WAS assessed and no lever committed. That is a
//                     real, reportable zero.
//   • a populated map — some levers committed; every other lever is AWAITING
//                     award, which is not the same as committed $0.
//
// `buildCommittedValueInsight` in `step-insight-builder.ts` already fixed this
// distinction for the ✦ Intelligence insight on this same signal ("a lever with
// no committed fact is shown HONESTLY as awaiting-award — never fabricated as
// 0"), so these beats inherit that rule rather than inventing a second one.
//
// It deliberately reads NOTHING from `SAMPLE_SELECTION_STAGE`. In particular the
// exemplar's `generates` entry carries a `d11` artifact code, and a
// `DeliverableSpec.key` is an internal identifier a reader on a client surface
// should not be shown — so `generates` is the archetype's own declared
// deliverables at this stage, which today is none on every rule-bearing
// archetype. Empty is the honest answer, not a reason to keep the fixture.
//
// This module DERIVES; it does not declare. `buildLiveStageView` stays the only
// thing that decides a view's provenance (the `U-533` boundary rule), so nothing
// here writes `beatProvenance`.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SourceEventArchetype,
  ValueLeverRule,
} from '@/lib/source/archetypes/types';
import type { ValueLeverResult } from '@/lib/source/facts/evaluators/types';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';
import type {
  GateConfirmView,
  GateDeliverableView,
  StageGateView,
  StageTaskView,
  TaskReviewRowView,
} from '@/components/source/canvas/analytics/view-model';

/** The stage this module builds. Exported so the builder cannot disagree with it. */
export const SELECTION_STAGE_KEY = 'selection';

/**
 * The fact template the award-commitments upload is parsed through. Kept equal to
 * the exemplar's code because the code names a REAL parser
 * (`COMMITTED_VALUE_V1` → `committed_value_usd` `value_lever` facts) rather than
 * exemplar copy — deriving a different one would break the upload.
 */
const COMMITTED_VALUE_TEMPLATE_CODE = 'COMMITTED_VALUE_V1';

export interface SelectionFactBeatInput {
  /** The archetype resolved for this event — the source of the lever rules. */
  archetype: SourceEventArchetype;
  /** The evaluator's per-lever verdicts, giving each lever its target band. */
  leverResults: readonly ValueLeverResult[];
  /** factKey → citation, so a confirmed number names the document it came from. */
  citations: Record<string, FactSourceCitation | null>;
  /**
   * leverKey → committed USD at award, from `readCommittedValueLevers`.
   * `undefined` means NO award fact has been observed — not that nothing
   * committed. An empty map means the award was assessed and nothing committed.
   */
  committedByLeverKey?: ReadonlyMap<string, number>;
  /** The computed next-stage label, already resolved from the canonical order. */
  nextStageName: string | null;
}

/** USD, as a reader reads it. */
function usd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * A lever key as a task id segment: lowercased, non-alphanumerics collapsed. The
 * rule keys are `AMS.ENHANCEMENT_LEAKAGE`-shaped, and a task id reaches the DOM
 * as a React key.
 */
function idSegment(leverKey: string): string {
  return leverKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * The document a lever's number can be cited to, or null. Reads the FIRST
 * consumed fact that has a citation rather than the first required input,
 * because an input the evaluator did not consume says nothing about where the
 * number came from.
 */
function citedDocFor(
  result: ValueLeverResult | undefined,
  citations: Record<string, FactSourceCitation | null>,
): string | null {
  for (const ref of result?.evidenceRefs ?? []) {
    const citation = citations[ref.factKey];
    if (citation?.doc) {
      return citation.locator
        ? `${citation.doc} · ${citation.locator}`
        : citation.doc;
    }
  }
  return null;
}

/** The target band for a lever, or null when the lever did not compute. */
function targetBandFor(
  result: ValueLeverResult | undefined,
): { low: number; high: number } | null {
  if (!result || result.insufficientEvidence) return null;
  return { low: result.low, high: result.high };
}

function targetLabel(band: { low: number; high: number } | null): string {
  return band ? `${usd(band.low)}–${usd(band.high)}` : 'Not yet quantified';
}

/**
 * The award read for this event, resolved against the archetype's DECLARED
 * levers.
 *
 * Only a lever the archetype declares can carry a commitment: a key the signal
 * names that no rule declares is not counted and is not surfaced, because a
 * stray `entity_ref` from another archetype's template would otherwise inflate
 * the coverage count on this gate and print a foreign identifier on a client
 * surface.
 */
function awardRead(input: SelectionFactBeatInput) {
  const rules: readonly ValueLeverRule[] = input.archetype.valueLeverRules ?? [];
  const resultByKey = new Map(
    input.leverResults.map((result) => [result.key, result]),
  );
  const observed = input.committedByLeverKey !== undefined;

  const levers = rules.map((rule) => {
    const result = resultByKey.get(rule.key);
    const committed = observed
      ? input.committedByLeverKey!.get(rule.key)
      : undefined;
    return {
      rule,
      result,
      band: targetBandFor(result),
      cited: citedDocFor(result, input.citations),
      committed,
    };
  });

  const committedLevers = levers.filter((lever) => lever.committed !== undefined);
  const awaitingLevers = levers.filter((lever) => lever.committed === undefined);
  const committedTotal = committedLevers.reduce(
    (sum, lever) => sum + (lever.committed ?? 0),
    0,
  );
  const targetLow = levers.reduce((sum, lever) => sum + (lever.band?.low ?? 0), 0);
  const targetHigh = levers.reduce((sum, lever) => sum + (lever.band?.high ?? 0), 0);

  return {
    observed,
    levers,
    committedLevers,
    awaitingLevers,
    committedTotal,
    targetLow,
    targetHigh,
    total: rules.length,
  };
}

type AwardRead = ReturnType<typeof awardRead>;
type AwardLever = AwardRead['levers'][number];

/**
 * The single beat for the un-observed state: ask for the commitments, with one
 * row per declared lever and its target band, so the request itself carries the
 * event's own levers rather than a fixture checklist.
 */
function requestCommitmentsTask(read: AwardRead): StageTaskView {
  const rows: TaskReviewRowView[] = read.levers.map((lever) => ({
    key: lever.rule.name,
    value: `Target ${targetLabel(lever.band)} · no award commitment read`,
    flag: true,
  }));

  return {
    id: 'selection.award-commitments',
    title: 'Provide the award commitments',
    subtitle: `${read.total} declared lever${read.total === 1 ? '' : 's'} · no award fact read yet`,
    type: 'provide',
    state: 'todo',
    guide:
      'Upload the award commitments (one row per value lever, keyed by lever key, with the committed value over the contract term). ' +
      'No award fact has been read for this event yet, so nothing below is a claim that a lever committed nothing — it is a claim that nothing has been read.',
    rows,
    provenance: {
      // The role that supplies the award record, matching the sibling derived
      // stages' `provenance.owner`. The DECIDING role is the gate's approver and
      // is derived from the archetype; this is the providing role, which the
      // archetype does not declare.
      owner: 'Sourcing lead',
      source: 'Executed contract / award record',
    },
    cta: 'Provide the award commitments',
    factTemplateCode: COMMITTED_VALUE_TEMPLATE_CODE,
  };
}

/** One `confirm` task per lever the award actually committed against. */
function committedTaskFor(lever: AwardLever): StageTaskView {
  const rows: TaskReviewRowView[] = [
    { key: 'Committed at award', value: usd(lever.committed ?? 0) },
    { key: 'Target band', value: targetLabel(lever.band) },
    {
      key: 'Cited to',
      value: lever.cited ?? 'No citation on the consumed facts',
      flag: lever.cited === null,
    },
  ];

  return {
    id: `selection.committed.${idSegment(lever.rule.key)}`,
    title: `Confirm the award commitment on ${lever.rule.name}`,
    subtitle: `${usd(lever.committed ?? 0)} committed · target ${targetLabel(lever.band)}`,
    type: 'confirm',
    state: 'todo',
    guide:
      `The award records ${usd(lever.committed ?? 0)} against this lever. Confirm that figure is the one the executed ` +
      `contract locks over the term — the committed value becomes the baseline the Value step measures realization against, ` +
      `so a figure confirmed here that the contract does not carry makes realization unfalsifiable.`,
    rows,
    cta: 'Confirm the commitment',
  };
}

/**
 * One `provide` task per declared lever the award signal did NOT commit against.
 *
 * The wording is "awaiting award", never "$0 committed". The signal being present
 * says the award was read; it does not say this lever was priced at nothing.
 */
function awaitingAwardTaskFor(lever: AwardLever): StageTaskView {
  const rows: TaskReviewRowView[] = [
    { key: 'Target band', value: targetLabel(lever.band) },
    { key: 'Committed at award', value: 'Awaiting award', flag: true },
  ];

  return {
    id: `selection.awaiting-award.${idSegment(lever.rule.key)}`,
    title: `Record the award commitment for ${lever.rule.name}`,
    subtitle: `Awaiting award · target ${targetLabel(lever.band)}`,
    type: 'provide',
    state: 'todo',
    guide:
      'The award read for this event carries no commitment against this lever. That is awaiting award, not a commitment of nothing — ' +
      `record the committed value the executed contract locks, or state that the award deliberately carries this lever at no value. ` +
      `${lever.rule.commercialRisk ?? 'A negotiated lever left out of the award is value the buyer forfeits.'}`,
    rows,
    cta: 'Record the award commitment',
    factTemplateCode: COMMITTED_VALUE_TEMPLATE_CODE,
  };
}

/**
 * The Selection task checklist for this event.
 *
 * Un-observed → one request beat. Observed → the committed levers first (in
 * archetype rule order), then the levers still awaiting award. Order is
 * deterministic, so the same facts always produce the same list.
 */
export function buildSelectionFactDerivedTasks(
  input: SelectionFactBeatInput,
): readonly StageTaskView[] {
  const read = awardRead(input);
  if (!read.observed) return [requestCommitmentsTask(read)];
  return [
    ...read.committedLevers.map((lever) => committedTaskFor(lever)),
    ...read.awaitingLevers.map((lever) => awaitingAwardTaskFor(lever)),
  ];
}

/**
 * The approver for this gate, as a ROLE.
 *
 * The exemplar carried `Commercial owner`, which is a role rather than a person
 * and so is not the liability `bafo-fact-beats` had to remove — but it is still a
 * fixture string that does not move with the event. The honest value is the role
 * the resolved archetype declares must own the decision, which differs per
 * archetype (`CIO` on managed services, `Procurement / Vendor Management` on a
 * renewal).
 */
export function selectionGateApprover(archetype: SourceEventArchetype): string {
  return archetype.requiredStakeholders[0] ?? 'Decision owner';
}

/**
 * The confirm boxes, stated from the award read so every label carries a measured
 * count or a measured magnitude. Three boxes, because the gate reads as three
 * attestations.
 */
function selectionGateConfirms(
  input: SelectionFactBeatInput,
): readonly GateConfirmView[] {
  const read = awardRead(input);

  const coverage: GateConfirmView = read.observed
    ? {
        label: `${read.committedLevers.length} of ${read.total} levers carried a committed value into the award`,
        detail:
          read.awaitingLevers.length > 0
            ? `${read.awaitingLevers.length} declared lever${read.awaitingLevers.length === 1 ? ' is' : 's are'} awaiting award and ` +
              `${read.awaitingLevers.length === 1 ? 'is' : 'are'} not committed at nothing: ` +
              `${read.awaitingLevers.map((lever) => lever.rule.name).join('; ')}.`
            : 'Every declared lever carries a committed value read from the award record.',
      }
    : {
        label: 'No award commitments observed',
        detail:
          'No award fact has been read for this event, so no lever on this gate is confirmed either way. ' +
          'This is an unread award, not an award that committed nothing.',
      };

  const baseline: GateConfirmView = read.observed
    ? {
        label: `${usd(read.committedTotal)} committed at award · target ${targetLabel(
          read.targetLow === 0 && read.targetHigh === 0
            ? null
            : { low: read.targetLow, high: read.targetHigh },
        )}`,
        detail:
          `This committed total is the baseline the Value step measures realization against. It sums only the ` +
          `${read.committedLevers.length} lever${read.committedLevers.length === 1 ? '' : 's'} the award record actually commits against; ` +
          'no awaiting-award lever is counted as zero.',
      }
    : {
        label: 'No committed baseline set',
        detail:
          'The Value step measures realization against the committed baseline. Until the award commitments are read there is no ' +
          'baseline to measure against, and realization would be unfalsifiable.',
      };

  const closing: GateConfirmView = {
    label: 'Award commitments confirmed against the executed contract',
    detail: input.nextStageName
      ? `Confirm each committed figure is the one the executed contract carries before advancing to ${input.nextStageName}.`
      : 'Confirm each committed figure is the one the executed contract carries before closing the event.',
  };

  return [coverage, baseline, closing];
}

/**
 * What generates on approval: the archetype's own deliverables at this stage.
 *
 * No `code` chip. A `DeliverableSpec.key` is an internal identifier, and a reader
 * on a client surface should not be shown one — so the label goes out and the key
 * stays in. No rule-bearing archetype declares a Selection deliverable today, so
 * this is empty, and empty is the honest answer.
 */
function selectionGateGenerates(
  archetype: SourceEventArchetype,
): readonly GateDeliverableView[] {
  return archetype.deliverablePack
    .filter((deliverable) => deliverable.stage === SELECTION_STAGE_KEY)
    .map((deliverable) => ({ label: deliverable.label }));
}

/** The Selection gate for this event, derived. */
export function buildSelectionFactDerivedGate(
  input: SelectionFactBeatInput,
): StageGateView {
  return {
    approver: selectionGateApprover(input.archetype),
    confirms: selectionGateConfirms(input),
    generates: selectionGateGenerates(input.archetype),
    nextStageName: input.nextStageName,
  };
}
