// ─────────────────────────────────────────────────────────────────────────────
// Item U-535 — the Evaluation stage's intake beats, derived from this event's
// facts and its resolved archetype.
//
// `U-533` measured that all ten armed stages carried `tasks` and `gate` verbatim
// from a `SAMPLE_*_STAGE` exemplar and made the carriage declare itself. `U-534`
// flipped `bafo`. This is the second stage to stop carrying, and it is the first
// one where the item's own two preferences could not both be honoured.
//
// WHY THIS STAGE, AND WHY THE CONFLICT IS REAL. `U-535` asks for a stage that
// still exposes a person-named approver (its acceptance 4) and for a stage where
// the archetype declares a deliverable, so the derived `gate.generates` is not
// empty (its acceptance 7). Measured over the three rule-bearing archetypes —
// the only ones that reach this code, since `buildLiveStageView` returns null
// without a computed lever — `bafo` is the ONLY stage of the ten where every one
// of them declares a `deliverablePack` entry, and `U-534` took it. `responses`,
// `evaluation`, `executive_decision`, `selection`, `transition` and `value`
// declare none on any archetype; `rfp` declares one on two of three. So no
// remaining stage satisfies acceptance (7), the choice cannot escape it by
// picking differently, and it follows acceptance (4) — the half the item calls
// the highest-value work, because the exemplar approver is a person who exists
// only in `sample-view-model.ts` and whom the gate grounding block hands to the
// model by name.
//
// AND THE WARNING ITSELF IS OVERSTATED, WHICH WAS MEASURED, NOT ASSUMED.
// Acceptance (7) calls an empty generates section "a visible regression". No
// reader can reach it: the only component that draws the section is `ScopeGate`,
// mounted solely by `ScopeAnalyticsStage`, which is imported by the analytics
// barrel and by tests and by no route — the same asymmetry
// `docs/architecture/u533-stage-scaffold-provenance.json` records when it lists
// `gate.generates` as reaching `model_prompt` and not `rendered_canvas`. On the
// path that IS reachable, `mode-grounding.ts` already suppresses the line when
// the list is empty, so the model prompt was honest before this change.
//
// The renderer was still corrected — it drew the "Prepared for approval" heading
// and its dashed box unconditionally, then promised in the footer that "these"
// are prepared after approval, with nothing above it to refer to — and it is
// covered by mounting that component directly in
// `src/components/source/canvas/analytics/__tests__/ScopeGate.u535EmptyGenerates.test.tsx`,
// which says in its own header that it proves a property of a component and not
// of any page. Backlog item 28 (mount or delete the unreachable Source
// components) is where that gap belongs. Emitting the exemplar's `Should-cost
// evaluation summary` to keep the box full was the alternative, and it would
// assert a deliverable no archetype declares — the defect this item exists to
// remove.
//
// WHAT IS READ, AND WHAT IS DELIBERATELY NOT. Every value below comes from one
// of three things that MOVE:
//
//   • the evaluator's `ValueLeverResult[]` for this event's facts — which lever
//     scored, its banded low/high, the facts it consumed, and for a lever that
//     could not compute, the keys the evaluator actually found missing;
//   • the caller's `citations`, so a scored row names the document behind it;
//   • the resolved archetype's declarations — each lever rule's
//     `evaluationImpact` (the scoring hook, which is this stage's parallel to the
//     `bafoAsk` `U-534` derived from), the `evaluationModel`'s weighted criteria
//     and disqualifiers, and `requiredStakeholders`.
//
// It reads NOTHING from `SAMPLE_EVALUATION_STAGE`. `purpose` is still exemplar
// copy on this stage; `beatProvenance` covers the two intake beats only and
// `docs/architecture/u533-stage-scaffold-provenance.json` is where the remaining
// carriage stays visible.
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
export const EVALUATION_STAGE_KEY = 'evaluation';

export interface EvaluationFactBeatInput {
  /** The archetype resolved for this event — the source of the scoring model. */
  archetype: SourceEventArchetype;
  /** The evaluator's per-lever verdicts for this event's facts. */
  leverResults: readonly ValueLeverResult[];
  /** factKey → citation, so a scored number names the document it came from. */
  citations: Record<string, FactSourceCitation | null>;
  /** The computed next-stage label, already resolved from the canonical order. */
  nextStageName: string | null;
}

/** USD, as a reader reads it. Ranges only — never a point estimate. */
function usd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * The document a lever's number can be cited to, or null. Reads the first
 * CONSUMED fact that carries a citation — an input the evaluator did not consume
 * says nothing about where the number came from.
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

function ruleIndex(
  archetype: SourceEventArchetype,
): Map<string, ValueLeverRule> {
  return new Map(
    (archetype.valueLeverRules ?? []).map((rule) => [rule.key, rule]),
  );
}

/** A key as an id segment — a task id reaches the DOM as a React key. */
function idSegment(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** A weight as a reader reads it: `0.3` → `30%`. */
function weightPct(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

/**
 * One `confirm` task per lever that scored: the scoring hook the rule declares,
 * with the computed range and the cited document beside it, so the evaluator
 * confirms a score input whose basis they can see.
 *
 * The guide is the rule's `evaluationImpact` and NOT its `bafoAsk`: the same six
 * levers reach BAFO as concessions to press, and reusing that wording here would
 * make this stage a rephrasing of `U-534`'s rather than a reading of what the
 * archetype says about scoring.
 */
function scoredLeverTaskFor(
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
    id: `evaluation.score.${idSegment(result.key)}`,
    title: `Score ${result.name} into the evaluation model`,
    subtitle: `${usd(result.low)}–${usd(result.high)} computed · ${result.valueType.replace(/_/g, ' ')}`,
    type: 'confirm',
    state: 'todo',
    guide: rule
      ? `How this lever moves the score: ${rule.evaluationImpact}`
      : 'Carry this lever’s computed value into the scorecard as an evidenced input, not as an impression.',
    rows,
    cta: 'Confirm the score input',
  };
}

/**
 * One `provide` task per lever that could not compute: the evidence request,
 * naming the fact keys the evaluator actually found missing rather than the
 * rule's whole required-evidence list, and saying what the scorecard loses
 * without them.
 */
function unscorableLeverTaskFor(
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

  const impact = rule
    ? `Unscored, this is the hook the scorecard loses: ${rule.evaluationImpact}`
    : 'Unscored, this lever contributes nothing to the ranking and cannot be defended in the decision brief.';

  return {
    id: `evaluation.evidence.${idSegment(result.key)}`,
    title: `Provide the scoring evidence for ${result.name}`,
    subtitle: `${result.missingEvidence.length} fact${result.missingEvidence.length === 1 ? '' : 's'} missing · cannot be scored`,
    type: 'provide',
    state: 'todo',
    guide: `${result.basis} ${impact}`,
    rows,
    cta: 'Provide the missing evidence',
  };
}

/**
 * The archetype's own scoring model as one review task: the weighted criteria the
 * bids are ranked on and the disqualifiers that auto-fail one.
 *
 * This is `archetype_derived`, not `fact_derived` — it does not move when the
 * event's facts move — and it is included because a scorecard whose criteria are
 * invisible is the defect this stage's exemplar had: a single carried task about
 * uploading bids, with nothing saying what they would be scored against.
 */
function evaluationModelTaskFor(
  archetype: SourceEventArchetype,
): StageTaskView {
  const { criteria, disqualifiers } = archetype.evaluationModel;
  const rows: TaskReviewRowView[] = criteria.map((criterion) => ({
    key: criterion.label,
    value: `${weightPct(criterion.weight)} of the score`,
  }));

  const guide = [
    `${archetype.name} ranks bids on ${criteria.length} weighted ${criteria.length === 1 ? 'criterion' : 'criteria'}.`,
    disqualifiers.length > 0
      ? `Auto-fail conditions declared for this event type: ${disqualifiers.join('; ')}.`
      : 'This archetype declares no auto-fail condition, so no bid is disqualified on structure alone.',
  ].join(' ');

  return {
    id: `evaluation.model.${idSegment(archetype.id)}`,
    title: `Apply the ${archetype.name} scoring model`,
    subtitle: `${criteria.length} weighted criteria · ${disqualifiers.length} disqualifier${disqualifiers.length === 1 ? '' : 's'}`,
    type: 'confirm',
    state: 'todo',
    guide,
    rows,
    cta: 'Confirm the scoring model',
  };
}

/**
 * The Evaluation task checklist for this event: the scoring model first, because
 * it is what the rest is scored against, then every lever that scored, then the
 * ones still short of evidence.
 *
 * Order is deterministic (archetype rule order within each half), so the same
 * facts always produce the same list.
 */
export function buildEvaluationFactDerivedTasks(
  input: EvaluationFactBeatInput,
): readonly StageTaskView[] {
  const rules = ruleIndex(input.archetype);
  const scored = input.leverResults.filter(
    (result) => !result.insufficientEvidence,
  );
  const unscorable = input.leverResults.filter(
    (result) => result.insufficientEvidence,
  );

  return [
    evaluationModelTaskFor(input.archetype),
    ...scored.map((result) =>
      scoredLeverTaskFor(result, rules.get(result.key), input.citations),
    ),
    ...unscorable.map((result) =>
      unscorableLeverTaskFor(result, rules.get(result.key)),
    ),
  ];
}

/**
 * The approver for this gate, as a ROLE.
 *
 * The exemplar carried `K. Oshima, CIO` — a person who exists only in
 * `sample-view-model.ts`, and whom the gate grounding block introduced to the
 * model by name. Nothing in an event's facts names a person, so the honest value
 * is the role the archetype declares must own the decision. Same rule `U-534`
 * applied at BAFO, deliberately: the two stages are owned by the same declared
 * stakeholder and inventing a different rule here to make the two look different
 * would be a preference dressed as a derivation.
 */
export function evaluationGateApprover(
  archetype: SourceEventArchetype,
): string {
  return archetype.requiredStakeholders[0] ?? 'Decision owner';
}

/**
 * The confirm boxes: what scored, what it is scored against, and the close. Three
 * boxes, per the view-model's documented 3-box gate, and every count on them is
 * measured rather than written.
 */
function evaluationGateConfirms(
  input: EvaluationFactBeatInput,
): readonly GateConfirmView[] {
  const total = input.leverResults.length;
  const scored = input.leverResults.filter((r) => !r.insufficientEvidence);
  const unscorable = input.leverResults.filter((r) => r.insufficientEvidence);
  const { criteria, disqualifiers } = input.archetype.evaluationModel;

  const inputs: GateConfirmView = {
    label: `${scored.length} of ${total} value levers scored from computed facts`,
    detail:
      scored.length > 0
        ? `Scored with a banded value and the facts behind it: ${scored
            .map((r) => r.name)
            .join('; ')}.` +
          (unscorable.length > 0
            ? ` Still unscored for want of evidence: ${unscorable
                .map((r) => r.name)
                .join('; ')} — ranked without them, the comparison is thinner than it looks.`
            : ' No lever is going into the ranking unevidenced.')
        : 'No lever has a computed value yet, so nothing on this scorecard is backed by a number.',
  };

  const model: GateConfirmView = {
    label: `Ranked on ${criteria.length} weighted ${criteria.length === 1 ? 'criterion' : 'criteria'}, ${disqualifiers.length} auto-fail checked`,
    detail: `${criteria
      .map((criterion) => `${criterion.label} ${weightPct(criterion.weight)}`)
      .join('; ')}.`,
  };

  const closing: GateConfirmView = {
    label: 'Scoring closed',
    detail: input.nextStageName
      ? `Bids are scored and ranked — advance to ${input.nextStageName}.`
      : 'Bids are scored and ranked, and this closes the event.',
  };

  return [inputs, model, closing];
}

/**
 * What generates on approval: the archetype's own deliverables at this stage.
 *
 * No rule-bearing archetype declares one at `evaluation` today, so this is
 * legitimately empty — see the header. The empty case is rendered as a stated
 * absence by `ScopeGate.tsx` and suppressed entirely in the model prompt by
 * `mode-grounding.ts`; it is not backfilled from the exemplar.
 *
 * No `code` chip: a `DeliverableSpec.key` is an internal identifier and a reader
 * on a client surface should not be shown one.
 */
function evaluationGateGenerates(
  archetype: SourceEventArchetype,
): readonly GateDeliverableView[] {
  return archetype.deliverablePack
    .filter((deliverable) => deliverable.stage === EVALUATION_STAGE_KEY)
    .map((deliverable) => ({ label: deliverable.label }));
}

/** The Evaluation gate for this event, derived. */
export function buildEvaluationFactDerivedGate(
  input: EvaluationFactBeatInput,
): StageGateView {
  return {
    approver: evaluationGateApprover(input.archetype),
    confirms: evaluationGateConfirms(input),
    generates: evaluationGateGenerates(input.archetype),
    nextStageName: input.nextStageName,
  };
}
