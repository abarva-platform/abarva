// Slice 1.6 — Source-to-Move handoff builder
//
// Pure builder for the connector that carries a decided Source sourcing event
// forward into a Move. See `source-to-move-handoff-types.ts` for the contract
// and the rationale.
//
// Pure function: identical inputs always yield identical output. No I/O, no
// DB, no model calls. Links event ↔ Move by id only.

import type {
  CarriedOpenItem,
  HandoffDelta,
  HandoffReadiness,
  MobilizationAssumption,
  SourceToMoveHandoff,
  SourceToMoveHandoffInput,
} from './source-to-move-handoff-types';

/** Fixed default timestamp so the builder stays pure when none is supplied. */
const DEFAULT_HANDED_OFF_AT = '2026-01-01T00:00:00.000Z';

/**
 * Build the structured Source-to-Move handoff record for a decided event.
 *
 * @param input The decided Source event plus the receiving Move's baseline.
 */
export function buildSourceToMoveHandoff(
  input: SourceToMoveHandoffInput,
): SourceToMoveHandoff {
  const { eventId, targetMoveId, eventLabel, deliveryModelGate, shouldCost } =
    input;

  const recommendedDeliveryModel = deliveryModelGate.recommendedModel;
  const plannedCostUsd = shouldCost.totalPoint;

  const readiness = deriveReadiness(deliveryModelGate.gateStatus);
  const carriedOpenItems = deriveCarriedOpenItems(deliveryModelGate);
  const deltas = deriveDeltas(input);
  const mobilizationAssumptions = deriveMobilizationAssumptions(input);

  const sourcingRecommendation = buildSourcingRecommendation(input);
  const receivingMoveGuidance = buildReceivingMoveGuidance(
    readiness,
    deltas,
    carriedOpenItems.length,
  );

  return {
    eventId,
    targetMoveId,
    eventLabel,
    handoffVersion: 'source-to-move-handoff/v1',
    handedOffAt: input.handedOffAt ?? DEFAULT_HANDED_OFF_AT,
    readiness,
    sourcingRecommendation,
    recommendedDeliveryModel,
    plannedCostUsd,
    deltas,
    mobilizationAssumptions,
    carriedOpenItems,
    receivingMoveGuidance,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveReadiness(
  gateStatus: SourceToMoveHandoffInput['deliveryModelGate']['gateStatus'],
): HandoffReadiness {
  switch (gateStatus) {
    case 'cleared':
      return 'ready';
    case 'blocked_open_questions':
      return 'ready_with_open_items';
    case 'blocked_insufficient_evidence':
    default:
      return 'not_ready';
  }
}

function deriveCarriedOpenItems(
  gate: SourceToMoveHandoffInput['deliveryModelGate'],
): CarriedOpenItem[] {
  return gate.openQuestions.map((q, index) => ({
    id: `open-${index + 1}`,
    question: q.question,
    whyItMatters: q.whyItBlocks,
  }));
}

function buildSourcingRecommendation(input: SourceToMoveHandoffInput): string {
  const { classification, deliveryModelGate, shouldCost } = input;
  return (
    `Source the '${classification.category.label}' need as ` +
    `${deliveryModelGate.recommendedModelLabel}; plan execution against a ` +
    `should-cost midpoint of ${formatUsd(shouldCost.totalPoint)} ` +
    `(range ${formatUsd(shouldCost.totalLow)}–${formatUsd(shouldCost.totalHigh)}).`
  );
}

function deriveDeltas(input: SourceToMoveHandoffInput): HandoffDelta[] {
  const baseline = input.moveBaseline;
  if (!baseline) return [];

  const deltas: HandoffDelta[] = [];
  const { deliveryModelGate, shouldCost, negotiationPosture } = input;

  // 1. Delivery-model delta.
  if (baseline.assumedDeliveryModel !== undefined) {
    const decided = deliveryModelGate.recommendedModel;
    if (baseline.assumedDeliveryModel !== decided) {
      deltas.push({
        dimension: 'delivery_model',
        title: 'Delivery model changed from the Move charter',
        direction: 'adverse',
        baseline: `Chartered assuming a '${baseline.assumedDeliveryModel}' delivery model.`,
        decided: `Sourcing decided on ${deliveryModelGate.recommendedModelLabel}.`,
        deltaUsd: null,
        implication:
          'The Move execution plan, vendor-management model, and required skills were scoped for a different delivery model — rebaseline the mobilization plan before kickoff.',
      });
    } else {
      deltas.push({
        dimension: 'delivery_model',
        title: 'Delivery model confirmed against the Move charter',
        direction: 'favorable',
        baseline: `Chartered assuming a '${baseline.assumedDeliveryModel}' delivery model.`,
        decided: `Sourcing confirmed ${deliveryModelGate.recommendedModelLabel}.`,
        deltaUsd: null,
        implication:
          'The sourcing decision validates the Move charter assumption — no delivery-model rebaseline needed.',
      });
    }
  }

  // 2. Cost delta vs. the chartered budget.
  if (baseline.assumedBudgetUsd !== undefined) {
    const swing = shouldCost.totalPoint - baseline.assumedBudgetUsd;
    const overBudget = swing > 0;
    deltas.push({
      dimension: 'cost',
      title: overBudget
        ? 'Should-cost exceeds the chartered Move budget'
        : 'Should-cost lands within the chartered Move budget',
      direction: overBudget ? 'adverse' : 'favorable',
      baseline: `Move chartered against a budget of ${formatUsd(baseline.assumedBudgetUsd)}.`,
      decided: `Should-cost midpoint is ${formatUsd(shouldCost.totalPoint)}.`,
      deltaUsd: swing,
      implication: overBudget
        ? `The Move is exposed to a ${formatUsd(swing)} budget gap — escalate for re-funding or re-scope before mobilizing.`
        : `The Move carries ${formatUsd(-swing)} of budget headroom against the should-cost midpoint.`,
    });
  }

  // 3. Duration delta — the should-cost iceberg implies a real run length;
  //    only flagged when a chartered duration exists to measure against.
  if (baseline.assumedDurationMonths !== undefined) {
    deltas.push({
      dimension: 'duration',
      title: 'Confirm the execution timeline against the should-cost basis',
      direction: 'neutral',
      baseline: `Move chartered for a ${baseline.assumedDurationMonths}-month execution window.`,
      decided:
        'Should-cost models the full TCO iceberg including transition and steady-state run.',
      deltaUsd: null,
      implication:
        'Reconcile the chartered duration with the transition and run layers in the should-cost estimate — a duration mismatch silently distorts the run-rate.',
    });
  }

  // 4. Incumbent-retention delta — the Move's transition planning depends on
  //    whether an incumbent is actually carried into the sourcing posture.
  if (baseline.assumedIncumbentRetained !== undefined) {
    const incumbentHeld = negotiationPosture.incumbentLeverage.hasIncumbent;
    if (baseline.assumedIncumbentRetained !== incumbentHeld) {
      deltas.push({
        dimension: 'incumbent',
        title: 'Incumbent posture diverges from the Move charter',
        direction: 'adverse',
        baseline: `Move chartered assuming the incumbent vendor would be ${baseline.assumedIncumbentRetained ? 'retained' : 'replaced'}.`,
        decided: incumbentHeld
          ? 'The sourcing posture is incumbent-anchored — the incumbent remains in play.'
          : 'The sourcing posture carries no incumbent — this is a competitive event.',
        deltaUsd: null,
        implication: incumbentHeld
          ? 'The Move planned for a competitive transition that is not happening — rebaseline the transition scope and onboarding cost downward.'
          : 'The Move must plan for vendor transition / onboarding it did not budget — fold the transition cost into the mobilization plan.',
      });
    } else {
      deltas.push({
        dimension: 'incumbent',
        title: 'Incumbent posture aligns with the Move charter',
        direction: 'favorable',
        baseline: `Move chartered assuming incumbent ${baseline.assumedIncumbentRetained ? 'retained' : 'replaced'}.`,
        decided: `Sourcing posture is ${incumbentHeld ? 'incumbent-anchored' : 'competitive'}.`,
        deltaUsd: null,
        implication:
          'The incumbent posture matches the charter — no transition rebaseline needed on this dimension.',
      });
    }
  }

  // 5. Risk delta — high-severity walk-away risks the Move inherits.
  const highRisks = negotiationPosture.walkAwayRisks.filter(
    (r) => r.severity === 'high',
  );
  if (highRisks.length > 0) {
    deltas.push({
      dimension: 'risk',
      title: `${highRisks.length} high-severity commercial risk(s) carry into execution`,
      direction: 'adverse',
      baseline: 'Move charter did not account for unresolved commercial risk.',
      decided: highRisks.map((r) => r.title).join('; '),
      deltaUsd: null,
      implication:
        'These walk-away risks become execution risks once the deal is signed — the Move must own the mitigation asks as kickoff entry criteria.',
    });
  }

  return deltas;
}

function deriveMobilizationAssumptions(
  input: SourceToMoveHandoffInput,
): MobilizationAssumption[] {
  const { deliveryModelGate, shouldCost, negotiationPosture } = input;
  const out: MobilizationAssumption[] = [];

  // From the delivery-model gate.
  out.push({
    id: nextMobId(out),
    assumption: `Mobilize for a ${deliveryModelGate.recommendedModelLabel} delivery model.`,
    rationale:
      'The delivery model dictates the Move team shape, vendor-management overhead, and the skills the receiving Move must staff.',
    source: 'delivery_model_gate',
  });

  // From the should-cost estimate.
  out.push({
    id: nextMobId(out),
    assumption: `Plan execution funding against a should-cost midpoint of ${formatUsd(shouldCost.totalPoint)}, not the vendor quote of ${formatUsd(shouldCost.vendorQuotedCost)}.`,
    rationale: `The vendor quote is only ~${Math.round(shouldCost.visibleShareOfTotal * 100)}% of true TCO; the Move budget must absorb the hidden iceberg layers.`,
    source: 'should_cost',
  });

  // From the negotiation posture — the clause must-haves become Move entry
  // criteria once the contract is signed.
  const mustHaveClauses = negotiationPosture.clauseIssues.filter(
    (c) => c.priority === 'must_have',
  );
  if (mustHaveClauses.length > 0) {
    out.push({
      id: nextMobId(out),
      assumption: `Inherit ${mustHaveClauses.length} must-have contract clause(s) as kickoff entry criteria: ${mustHaveClauses
        .map((c) => c.clause)
        .join(', ')}.`,
      rationale:
        'Clauses the negotiation secured (or must secure) define the contractual envelope the Move executes within — the execution plan must not assume terms outside it.',
      source: 'negotiation_posture',
    });
  }

  // From the classification — the category strategy frames the Move's intent.
  out.push({
    id: nextMobId(out),
    assumption: `Treat this Move as a '${input.classification.category.label}' transformation under a '${deliveryModelGate.buyingMotion}' buying motion.`,
    rationale:
      'The sourcing category and buying motion frame what the Move is actually transforming and how the commercial relationship is governed.',
    source: 'classification',
  });

  return out;
}

function buildReceivingMoveGuidance(
  readiness: HandoffReadiness,
  deltas: HandoffDelta[],
  openItemCount: number,
): string {
  const adverse = deltas.filter((d) => d.direction === 'adverse');

  if (readiness === 'not_ready') {
    return (
      'Do not mobilize: the delivery-model gate is blocked on insufficient ' +
      'evidence. The sourcing decision is not yet firm enough to charter ' +
      'execution against — return to Source to close the evidence gap.'
    );
  }

  if (adverse.length > 0) {
    return (
      `Mobilize with caution: ${adverse.length} adverse delta(s) move this Move ` +
      `off its original charter — rebaseline ${adverse
        .map((d) => d.dimension)
        .join(', ')} before kickoff` +
      (openItemCount > 0
        ? `, and resolve ${openItemCount} open gate item(s) carried into execution.`
        : '.')
    );
  }

  if (openItemCount > 0) {
    return (
      `Mobilize: the sourcing decision aligns with the Move charter, but ` +
      `${openItemCount} open gate item(s) follow into execution — own them as ` +
      'kickoff entry criteria.'
    );
  }

  return (
    'Mobilize: the sourcing decision is firm and aligns with the Move ' +
    'charter — the receiving Move can charter execution directly against ' +
    'this handoff.'
  );
}

const MAX_ABS = Number.MAX_SAFE_INTEGER;

function formatUsd(value: number): string {
  const safe = Math.max(-MAX_ABS, Math.min(MAX_ABS, Math.round(value)));
  const sign = safe < 0 ? '-' : '';
  return `${sign}$${Math.abs(safe).toLocaleString('en-US')}`;
}

function nextMobId(existing: readonly MobilizationAssumption[]): string {
  return `mob-a${existing.length + 1}`;
}
