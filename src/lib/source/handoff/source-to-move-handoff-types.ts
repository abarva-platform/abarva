// Slice 1.6 — Source-to-Move handoff
//
// Types for the connector that lets a completed / decided Source sourcing
// event flow back into transformation execution as structured input to a
// Move. Per the North-Star loop (Wave 1 of the product-enhancement plan), a
// sourcing decision is not a terminal artifact — it must carry forward into
// the Move that executes the transformation, or the loop is broken.
//
// Given the four upstream Source artifacts of a decided event —
//
//   - the category classification / strategy (Slice 1.1),
//   - the delivery-model gate result (Slice 1.2),
//   - the should-cost estimate (Slice 1.3),
//   - the negotiation posture (Slice 1.5) —
//
// the builder produces a structured `SourceToMoveHandoff` record that links
// the Source event back to a receiving Move: the sourcing recommendation, the
// cost / risk deltas vs. the Move's original assumptions, and the
// mobilization assumptions the receiving Move should inherit.
//
// Standalone module. Pure: no I/O, no DB, no model calls. It links to events
// and Moves by id only — cross-module persistence is a separate follow-up
// and intentionally NOT done here.

import type { DeliveryModel, DeliveryModelGateResult } from '../delivery-model/delivery-model-gate';
import type { ShouldCostEstimate } from '../should-cost/should-cost-model';
import type { NegotiationPosture } from '../negotiation/negotiation-posture-types';
import type { CategoryClassification } from '../classifier/category-classifier';

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * The Move's original transformation assumptions, captured when the Move was
 * chartered — before the Source event ran. The handoff measures the sourcing
 * decision against these to surface deltas the receiving Move must absorb.
 * Every field is optional: the builder degrades gracefully and simply
 * produces fewer deltas when the baseline is thin.
 */
export interface MoveBaselineAssumptions {
  /** The delivery model the Move was chartered assuming, if any. */
  assumedDeliveryModel?: DeliveryModel;
  /** The budget the Move was chartered against, in USD. */
  assumedBudgetUsd?: number;
  /** The duration the Move was chartered against, in months. */
  assumedDurationMonths?: number;
  /**
   * Whether the Move was chartered assuming an incumbent vendor would be
   * retained (vs. a competitive switch).
   */
  assumedIncumbentRetained?: boolean;
}

/**
 * The decided Source event being handed off. The four artifacts are the
 * outputs of Slices 1.1–1.5; `eventId` and `targetMoveId` are the existing
 * identifiers used to link the two records without shared persistence.
 */
export interface SourceToMoveHandoffInput {
  /** Existing Source event identifier. */
  eventId: string;
  /** Existing identifier of the Move that receives the handoff. */
  targetMoveId: string;
  /** Free-text label for the sourcing event / deal. */
  eventLabel: string;
  /** Slice 1.1 category classification — the sourcing strategy. */
  classification: CategoryClassification;
  /** Slice 1.2 delivery-model gate result. */
  deliveryModelGate: DeliveryModelGateResult;
  /** Slice 1.3 should-cost estimate. */
  shouldCost: ShouldCostEstimate;
  /** Slice 1.5 negotiation posture. */
  negotiationPosture: NegotiationPosture;
  /** The Move's original chartered assumptions, if known. */
  moveBaseline?: MoveBaselineAssumptions;
  /** ISO timestamp; defaults to a fixed value so the module stays pure. */
  handedOffAt?: string;
}

// ── Output ───────────────────────────────────────────────────────────────────

/** Whether the sourcing decision is ready to be executed by a Move. */
export type HandoffReadiness =
  | 'ready' // The delivery-model gate cleared — the Move can mobilize.
  | 'ready_with_open_items' // Decided, but open gate questions follow into the Move.
  | 'not_ready'; // The gate is blocked — the Move should not mobilize yet.

/** The direction a delta moves the Move relative to its original charter. */
export type DeltaDirection = 'favorable' | 'adverse' | 'neutral';

/** The kind of baseline assumption a delta measures against. */
export type DeltaDimension =
  | 'delivery_model'
  | 'cost'
  | 'duration'
  | 'incumbent'
  | 'risk';

/**
 * One measured difference between the sourcing decision and the Move's
 * original charter assumptions — the thing the receiving Move must absorb.
 */
export interface HandoffDelta {
  dimension: DeltaDimension;
  /** Short headline naming the delta. */
  title: string;
  direction: DeltaDirection;
  /** What the Move was chartered to assume. */
  baseline: string;
  /** What the sourcing decision actually landed on. */
  decided: string;
  /** The numeric swing in USD where quantifiable; null when not. */
  deltaUsd: number | null;
  /** What the receiving Move owner should do about it. */
  implication: string;
}

/**
 * A mobilization assumption the receiving Move should inherit — a fact the
 * sourcing decision establishes that the Move's execution plan depends on.
 */
export interface MobilizationAssumption {
  /** Stable id, unique within the record, e.g. 'mob-a1'. */
  id: string;
  /** The assumption, stated as the Move owner should carry it forward. */
  assumption: string;
  /** Why it matters to the Move's execution plan. */
  rationale: string;
  /** Where in the sourcing decision the assumption is grounded. */
  source: 'delivery_model_gate' | 'should_cost' | 'negotiation_posture' | 'classification';
}

/** An open item that follows the handoff into the Move and must be resolved. */
export interface CarriedOpenItem {
  /** Stable id, unique within the record, e.g. 'open-1'. */
  id: string;
  /** The open question, carried verbatim from the delivery-model gate. */
  question: string;
  /** Why it still blocks once execution begins. */
  whyItMatters: string;
}

/** The structured record produced by the handoff builder. */
export interface SourceToMoveHandoff {
  /** Echoed Source event id — the link back to the sourcing event. */
  eventId: string;
  /** Echoed target Move id — the link forward to the receiving Move. */
  targetMoveId: string;
  eventLabel: string;
  handoffVersion: 'source-to-move-handoff/v1';
  handedOffAt: string;
  /** Whether the receiving Move can mobilize on this decision. */
  readiness: HandoffReadiness;
  /**
   * The sourcing recommendation, stated as a one-line directive the Move
   * owner can act on — delivery model, category, and headline economics.
   */
  sourcingRecommendation: string;
  /** The recommended delivery model, lifted from the gate. */
  recommendedDeliveryModel: DeliveryModel;
  /** Should-cost midpoint the Move should plan execution against, in USD. */
  plannedCostUsd: number;
  /** Cost / risk / model deltas vs. the Move's original charter. */
  deltas: HandoffDelta[];
  /** Mobilization assumptions the receiving Move should inherit. */
  mobilizationAssumptions: MobilizationAssumption[];
  /** Open gate items that follow the handoff into the Move. */
  carriedOpenItems: CarriedOpenItem[];
  /** The single most important note for the receiving Move owner. */
  receivingMoveGuidance: string;
}
