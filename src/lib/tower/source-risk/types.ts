// Source risk in Tower · Wave 3, Slice 3.3 · shared types.
//
// Tower governs Move portfolio health. But a Move that depends on a
// sourcing decision inherits commercial execution risk the portfolio
// view does not otherwise show: a delivery model that changed under the
// Move's feet, a should-cost that blew past the chartered budget, an
// incumbent posture that diverged, or open gate items that followed the
// handoff into execution.
//
// This module joins the Slice 1.6 Source-to-Move handoff records
// (`SourceToMoveHandoff`) against the Slice 3.1 outcome ledger view
// (`OutcomeLedgerView`) and produces a Tower-facing read: per-Move
// sourcing risk, surfaced *inside* portfolio governance — so a CXO who
// reads "this program's portfolio health looks fine" also sees "but the
// vendor it depends on is the real risk".
//
// Pure: no I/O, no DB, no model calls. Joins by id only.

import type {
  DeltaDimension,
  HandoffReadiness,
  SourceToMoveHandoff,
} from '@/lib/source/handoff/source-to-move-handoff-types';
import type { OutcomeLedgerView } from '@/lib/tower/outcome-ledger';

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * Input to the source-risk view builder for one tenant.
 *
 * Both inputs are already-built artifacts from upstream slices — this
 * module performs no data-plane read of its own. `handoffs` are the
 * Slice 1.6 records that link decided Source events to receiving Moves;
 * `ledger` is the Slice 3.1 Tower outcome ledger for the same tenant.
 */
export interface SourceRiskViewInput {
  /** Canonical tenant slug, e.g. `apexretail`. */
  readonly tenantClientKey: string;
  /** Slice 1.6 Source-to-Move handoff records linked to portfolio Moves. */
  readonly handoffs: readonly SourceToMoveHandoff[];
  /** Slice 3.1 outcome ledger view for the same tenant. */
  readonly ledger: OutcomeLedgerView;
}

// ── Output ───────────────────────────────────────────────────────────────────

/**
 * Coarse sourcing-risk posture for one Move, read at a glance by a CXO.
 *
 * - `clear`    — the handoff is firm, aligned to the Move charter, no
 *                adverse deltas and no open items.
 * - `watch`    — open gate items follow into execution, or a cost delta
 *                is adverse but modest; manageable, but track it.
 * - `exposed`  — adverse deltas the Move must rebaseline (delivery model,
 *                incumbent, high-severity commercial risk) or a material
 *                budget gap.
 * - `blocked`  — the handoff readiness is `not_ready`; the Move should
 *                not be mobilizing at all.
 */
export const SOURCE_RISK_LEVELS = [
  'clear',
  'watch',
  'exposed',
  'blocked',
] as const;

export type SourceRiskLevel = (typeof SOURCE_RISK_LEVELS)[number];

/** A single sourcing-risk driver carried out of the Slice 1.6 handoff. */
export interface SourceRiskDriver {
  /** Which handoff dimension the driver came from. */
  readonly dimension: DeltaDimension;
  /** Short headline naming the risk. */
  readonly title: string;
  /** What a CXO should do about it. */
  readonly implication: string;
  /** The USD swing where quantifiable; null when not. */
  readonly deltaUsd: number | null;
}

/**
 * The per-Move sourcing-risk read. One row per Move that has a Source
 * handoff linked to it — joined, where possible, against its outcome
 * ledger value claims so the CXO sees commercial risk next to value.
 */
export interface MoveSourceRisk {
  /** The receiving Move id — the join key into the portfolio. */
  readonly moveId: string;
  /** The decided Source event id behind the handoff. */
  readonly eventId: string;
  /** Free-text label for the sourcing event / deal. */
  readonly eventLabel: string;
  /** Coarse sourcing-risk posture for the Move. */
  readonly riskLevel: SourceRiskLevel;
  /** Handoff readiness lifted from the Slice 1.6 record. */
  readonly readiness: HandoffReadiness;
  /** The recommended delivery model behind the handoff. */
  readonly recommendedDeliveryModel: SourceToMoveHandoff['recommendedDeliveryModel'];
  /** Should-cost midpoint the Move plans execution against, in USD. */
  readonly plannedCostUsd: number;
  /**
   * Net adverse cost swing across the handoff's cost deltas, in USD.
   * Positive means the Move is exposed to a budget gap; 0 when no cost
   * delta was adverse.
   */
  readonly costExposureUsd: number;
  /** The adverse / open-item drivers behind the risk level. */
  readonly drivers: readonly SourceRiskDriver[];
  /** Count of open gate items that followed the handoff into the Move. */
  readonly carriedOpenItemCount: number;
  /**
   * True when the Move carries one or more outcome ledger value claims
   * — i.e. the portfolio view shows a value figure for it. This is the
   * "looks fine on portfolio health, but…" flag: a Move can show
   * tracked / verified value and still be sourcing-`exposed`.
   */
  readonly hasLedgerValueClaim: boolean;
  /**
   * One-line Tower-facing read joining portfolio value posture and
   * sourcing risk — the sentence a CXO acts on.
   */
  readonly towerReadout: string;
}

/** Aggregated rollup over the per-Move rows. */
export interface SourceRiskSummary {
  /** Number of Moves with a Source handoff in scope. */
  readonly movesInScope: number;
  /** Count of Moves at each risk level. */
  readonly byRiskLevel: Readonly<Record<SourceRiskLevel, number>>;
  /** Total adverse cost exposure across all Moves, in USD. */
  readonly totalCostExposureUsd: number;
  /**
   * Count of Moves that carry an outcome ledger value claim AND are
   * sourcing-`exposed` or `blocked` — the headline "portfolio health
   * looks fine, vendor is the risk" population.
   */
  readonly valueClaimingButSourcingExposedCount: number;
}

/** The Tower-facing source-risk view model for one tenant. */
export interface SourceRiskView {
  readonly tenantClientKey: string;
  /** Per-Move rows, sorted most-exposed first. */
  readonly moves: readonly MoveSourceRisk[];
  readonly summary: SourceRiskSummary;
}
