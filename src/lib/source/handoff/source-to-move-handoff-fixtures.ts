// Slice 1.6 — Source-to-Move handoff fixtures
//
// Composes the real upstream Source builders (classifier 1.1, delivery-model
// gate 1.2) and reuses the published negotiation fixtures (1.3 + 1.5) to
// produce realistic, fully-typed handoff inputs for the tests. Nothing here
// mocks a contract — every artifact is a genuine output of its module.

import { classifySourcingEvent } from '../classifier/category-classifier';
import { runDeliveryModelGate } from '../delivery-model/delivery-model-gate';
import { buildNegotiationPosture } from '../negotiation/negotiation-posture';
import {
  APEX_AMS_NEGOTIATION_INPUT,
  APEX_AMS_SHOULD_COST_ESTIMATE,
} from '../negotiation/negotiation-posture-fixtures';
import type { SourceToMoveHandoffInput } from './source-to-move-handoff-types';

// ── A decided AMS sourcing event with strong delivery signals ─────────────────

const APEX_AMS_CLASSIFICATION = classifySourcingEvent(
  {
    name: 'Apex Retail AMS run/maintain re-compete',
    description: 'Application managed services for the core retail platform.',
  },
  {
    loadedSegments: ['it_landscape', 'vendor_contracts', 'it_financials'],
  },
);

/** Gate result for a clean, fully-signalled delivery-model decision. */
const APEX_AMS_CLEARED_GATE = runDeliveryModelGate(APEX_AMS_CLASSIFICATION, {
  ownsCoveringCapability: false,
  internalCapability: 'partial',
  isCoreDifferentiator: false,
  hasIncumbentContract: false,
  workShape: 'steady_state_run',
  loadedSegments: ['it_landscape', 'vendor_contracts', 'it_financials'],
});

/** Gate result with thin signals — blocked on insufficient evidence. */
const APEX_AMS_BLOCKED_GATE = runDeliveryModelGate(APEX_AMS_CLASSIFICATION, {
  loadedSegments: [],
});

const APEX_AMS_NEGOTIATION_POSTURE = buildNegotiationPosture(
  APEX_AMS_NEGOTIATION_INPUT,
);

// ── Exported handoff inputs ───────────────────────────────────────────────────

/**
 * A ready handoff: cleared gate, and a Move baseline that mostly matches the
 * sourcing decision (model confirmed, budget headroom).
 */
export const APEX_AMS_READY_HANDOFF_INPUT: SourceToMoveHandoffInput = {
  eventId: 'evt-apex-ams-001',
  targetMoveId: 'move-apex-ams-runops-001',
  eventLabel: 'Apex Retail AMS run/maintain re-compete',
  classification: APEX_AMS_CLASSIFICATION,
  deliveryModelGate: APEX_AMS_CLEARED_GATE,
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  negotiationPosture: APEX_AMS_NEGOTIATION_POSTURE,
  moveBaseline: {
    assumedDeliveryModel: APEX_AMS_CLEARED_GATE.recommendedModel,
    assumedBudgetUsd: APEX_AMS_SHOULD_COST_ESTIMATE.totalHigh * 1.5,
    assumedDurationMonths: 24,
    assumedIncumbentRetained: true,
  },
  handedOffAt: '2026-02-01T00:00:00.000Z',
};

/**
 * An adverse-delta handoff: cleared gate, but the Move was chartered against
 * a different delivery model, a budget below should-cost, and incumbent
 * retention the sourcing posture does not support.
 */
export const APEX_AMS_ADVERSE_HANDOFF_INPUT: SourceToMoveHandoffInput = {
  eventId: 'evt-apex-ams-002',
  targetMoveId: 'move-apex-ams-runops-002',
  eventLabel: 'Apex Retail AMS run/maintain re-compete (off-charter)',
  classification: APEX_AMS_CLASSIFICATION,
  deliveryModelGate: APEX_AMS_CLEARED_GATE,
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  negotiationPosture: APEX_AMS_NEGOTIATION_POSTURE,
  moveBaseline: {
    assumedDeliveryModel: 'build',
    assumedBudgetUsd: Math.round(APEX_AMS_SHOULD_COST_ESTIMATE.totalLow * 0.5),
    assumedDurationMonths: 12,
    assumedIncumbentRetained: false,
  },
};

/** A not-ready handoff: the delivery-model gate is blocked. */
export const APEX_AMS_NOT_READY_HANDOFF_INPUT: SourceToMoveHandoffInput = {
  eventId: 'evt-apex-ams-003',
  targetMoveId: 'move-apex-ams-runops-003',
  eventLabel: 'Apex Retail AMS run/maintain re-compete (undecided)',
  classification: APEX_AMS_CLASSIFICATION,
  deliveryModelGate: APEX_AMS_BLOCKED_GATE,
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  negotiationPosture: APEX_AMS_NEGOTIATION_POSTURE,
};

/** A handoff with no Move baseline at all — exercises graceful degradation. */
export const APEX_AMS_NO_BASELINE_HANDOFF_INPUT: SourceToMoveHandoffInput = {
  eventId: 'evt-apex-ams-004',
  targetMoveId: 'move-apex-ams-runops-004',
  eventLabel: 'Apex Retail AMS run/maintain re-compete (no charter baseline)',
  classification: APEX_AMS_CLASSIFICATION,
  deliveryModelGate: APEX_AMS_CLEARED_GATE,
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  negotiationPosture: APEX_AMS_NEGOTIATION_POSTURE,
};
