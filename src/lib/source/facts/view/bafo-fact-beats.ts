// ─────────────────────────────────────────────────────────────────────────────
// Item U-534 — the BAFO stage's intake beats, derived from this event's facts.
//
// `buildLiveStageView` composed a live waterfall and a live intel beat and then
// carried the stage exemplar's `tasks` and `gate` through verbatim on all ten
// armed stages. `U-533` measured that and made the carriage declare itself;
// this module is the first stage whose two intake beats stop being carried.
//
// WHY THIS STAGE, and it is a measurement rather than a preference.
// `buildLiveStageView` returns null unless at least one value lever computes, so
// only an archetype carrying `valueLeverRules` reaches this code at all. Across
// those archetypes NO archetype declares a `gateCriteria`, a `deliverablePack`
// entry or a `stageModel` row at stage `value` — the obvious first pick is the
// one stage the archetype has nothing to say about. `bafo` has a deliverable on
// every rule-bearing archetype, a different one per archetype, and every lever
// rule carries a `bafoAsk`, which is what a BAFO task list should be made of.
// `src/lib/source/facts/__tests__/u534-bafo-fact-derived-beats.test.ts` asserts
// both of those over the registry rather than leaving them in this comment.
//
// WHAT "FACT-DERIVED" HAS TO MEAN HERE. Not "different from the exemplar" — a
// hand-written alternative to a fixture is still a fixture. Every value below is
// read from one of three things that MOVE:
//
//   • the evaluator's own `ValueLeverResult[]` for this event's facts — which
//     lever computed, its banded low/high, the fact keys it consumed, and for a
//     lever that could not compute, the keys that were missing;
//   • the caller's `citations`, so a confirm row names the document the number
//     was read from;
//   • the resolved archetype's declarations — its lever rules' `bafoAsk`, its
//     `deliverablePack` at this stage, and its `requiredStakeholders`.
//
// It deliberately reads NOTHING from `SAMPLE_BAFO_STAGE`. The remaining carried
// field on this stage is `purpose`, which `beatProvenance` does not cover and
// which `docs/architecture/u533-stage-scaffold-provenance.json` still records.
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
export const BAFO_STAGE_KEY = 'bafo';

export interface BafoFactBeatInput {
  /** The archetype resolved for this event — the source of the lever rules. */
  archetype: SourceEventArchetype;
  /** The evaluator's per-lever verdicts for this event's facts. */
  leverResults: readonly ValueLeverResult[];
  /** factKey → citation, so a confirmed number names the document it came from. */
  citations: Record<string, FactSourceCitation | null>;
  /** The computed next-stage label, already resolved from the canonical order. */
  nextStageName: string | null;
}

/** USD, as a reader reads it. Ranges only — never a point estimate. */
function usd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * The document a lever's number can be cited to, or null.
 *
 * Reads the FIRST consumed fact that has a citation rather than the first
 * required input, because an input the evaluator did not consume says nothing
 * about where the number came from.
 */
function citedDocFor(
  result: ValueLeverResult,
  citations: Record<string, FactSourceCitation | null>,
): string | null {
  for (const ref of result.evidenceRefs) {
    const citation = citations[ref.factKey];
    if (citation?.doc) {
      return citation.locator
        ? `${citation.doc} · ${citation.locator}`
        : citation.doc;
    }
  }
  return null;
}

/** The rule a result came from, by key. */
function ruleIndex(
  archetype: SourceEventArchetype,
): Map<string, ValueLeverRule> {
  return new Map(
    (archetype.valueLeverRules ?? []).map((rule) => [rule.key, rule]),
  );
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
 * One `confirm` task per lever that computed: the ask this lever becomes at BAFO,
 * with the computed range and the cited document beside it so the reader confirms
 * a number they can see the basis of.
 */
function confirmTaskFor(
  result: ValueLeverResult,
  rule: ValueLeverRule | undefined,
  citations: Record<string, FactSourceCitation | null>,
): StageTaskView {
  const cited = citedDocFor(result, citations);
  const rows: TaskReviewRowView[] = [
    {
      key: 'Computed value over term',
      value: `${usd(result.low)}–${usd(result.high)} · ${result.confidence} confidence`,
    },
    { key: 'Basis', value: result.basis },
    {
      key: 'Cited to',
      value: cited ?? 'No citation on the consumed facts',
      flag: cited === null,
    },
  ];

  return {
    id: `bafo.ask.${idSegment(result.key)}`,
    title: `Press the BAFO ask on ${result.name}`,
    subtitle: `${usd(result.low)}–${usd(result.high)} computed · ${result.valueType.replace(/_/g, ' ')}`,
    type: 'confirm',
    state: 'todo',
    guide:
      rule?.bafoAsk ??
      `Press this lever in the BAFO round and book the concession against it.`,
    rows,
    cta: 'Confirm the ask is booked',
  };
}

/**
 * One `provide` task per lever that could not compute: the evidence request,
 * naming the fact keys the evaluator actually found missing rather than the
 * rule's whole required-evidence list.
 */
function evidenceTaskFor(
  result: ValueLeverResult,
  rule: ValueLeverRule | undefined,
): StageTaskView {
  const inputLabels = new Map(
    (rule?.computation.inputs ?? []).map((input) => [input.key, input.label]),
  );
  const rows: TaskReviewRowView[] = result.missingEvidence.map((factKey) => ({
    key: inputLabels.get(factKey) ?? 'Missing fact',
    value: factKey,
    flag: true,
  }));

  const risk = rule?.commercialRisk;
  const guide = [
    `This lever has no computed value yet: ${result.basis}`,
    risk ?? 'Without the facts below the lever renders "needs evidence", never a guess.',
  ].join(' ');

  return {
    id: `bafo.evidence.${idSegment(result.key)}`,
    title: `Provide the missing evidence for ${result.name}`,
    subtitle: `${result.missingEvidence.length} fact${result.missingEvidence.length === 1 ? '' : 's'} missing · not yet quantified`,
    type: 'provide',
    state: 'todo',
    guide,
    rows,
    cta: 'Provide the missing evidence',
  };
}

/**
 * The BAFO task checklist for this event: every lever the archetype declares,
 * computed ones first as asks to press, then the ones still short of evidence.
 *
 * Order is deterministic (archetype rule order within each half), so the same
 * facts always produce the same list.
 */
export function buildBafoFactDerivedTasks(
  input: BafoFactBeatInput,
): readonly StageTaskView[] {
  const rules = ruleIndex(input.archetype);
  const computed = input.leverResults.filter(
    (result) => !result.insufficientEvidence,
  );
  const insufficient = input.leverResults.filter(
    (result) => result.insufficientEvidence,
  );

  return [
    ...computed.map((result) =>
      confirmTaskFor(result, rules.get(result.key), input.citations),
    ),
    ...insufficient.map((result) =>
      evidenceTaskFor(result, rules.get(result.key)),
    ),
  ];
}

/**
 * The approver for this gate, as a ROLE.
 *
 * The exemplar carried `K. Oshima, CIO` — a person who exists only in
 * `sample-view-model.ts`, and whom the grounding block introduced to the model by
 * name. Nothing in an event's facts names a person, so the honest value is the
 * role the archetype declares must own the decision. It moves with the archetype
 * (`CIO` on managed services, `CDO / CDAO` on a data platform) and it is not a
 * name anyone can be quoted as having approved.
 */
export function bafoGateApprover(archetype: SourceEventArchetype): string {
  return archetype.requiredStakeholders[0] ?? 'Decision owner';
}

/**
 * The confirm boxes, stated from the computed / needs-evidence split so the
 * numbers on them move with the facts. Three boxes, because the gate reads as
 * three attestations, but every label carries a measured count.
 */
function bafoGateConfirms(
  input: BafoFactBeatInput,
): readonly GateConfirmView[] {
  const total = input.leverResults.length;
  const computed = input.leverResults.filter(
    (result) => !result.insufficientEvidence,
  );
  const insufficient = input.leverResults.filter(
    (result) => result.insufficientEvidence,
  );

  const pressed: GateConfirmView = {
    label: `${computed.length} of ${total} levers pressed with a computed ask`,
    detail:
      computed.length > 0
        ? `Each has a banded value over term and the facts it was computed from: ${computed
            .map((result) => result.name)
            .join('; ')}.`
        : 'No lever has a computed value yet, so no ask on this gate is backed by a number.',
  };

  const outstanding: GateConfirmView =
    insufficient.length > 0
      ? {
          label: `${insufficient.length} of ${total} levers still need evidence`,
          detail: `Pressed without it, the ask overstates a number the vendor can refute: ${insufficient
            .map((result) => result.name)
            .join('; ')}.`,
        }
      : {
          label: `All ${total} levers have a computed basis`,
          detail:
            'No lever is going into the round as an unevidenced ask — every one names the facts behind it.',
        };

  const closing: GateConfirmView = {
    label: 'Best-and-final round closed',
    detail: input.nextStageName
      ? `The round is final — advance to ${input.nextStageName}.`
      : 'The round is final and this closes the event.',
  };

  return [pressed, outstanding, closing];
}

/**
 * What generates on approval: the archetype's own deliverables at this stage.
 *
 * No `code` chip. A `DeliverableSpec.key` is an internal identifier
 * (`ams_negotiation_memo`), and a reader on a client surface should not be shown
 * one — so the label goes out and the key stays in.
 */
function bafoGateGenerates(
  archetype: SourceEventArchetype,
): readonly GateDeliverableView[] {
  return archetype.deliverablePack
    .filter((deliverable) => deliverable.stage === BAFO_STAGE_KEY)
    .map((deliverable) => ({ label: deliverable.label }));
}

/** The BAFO gate for this event, derived. */
export function buildBafoFactDerivedGate(
  input: BafoFactBeatInput,
): StageGateView {
  return {
    approver: bafoGateApprover(input.archetype),
    confirms: bafoGateConfirms(input),
    generates: bafoGateGenerates(input.archetype),
    nextStageName: input.nextStageName,
  };
}
