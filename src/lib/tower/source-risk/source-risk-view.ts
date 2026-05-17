// Source risk in Tower · Wave 3, Slice 3.3 · view model.
//
// Pure transforms that join the Slice 1.6 Source-to-Move handoff
// records against the Slice 3.1 outcome ledger view and produce the
// Tower-facing per-Move sourcing-risk read.
//
// Expert value: sourcing risk made visible at the portfolio level. A
// Move can show clean portfolio health and tracked / verified value in
// the outcome ledger while the vendor it depends on is the real risk —
// a delivery model that changed under its charter, a should-cost that
// blew past budget, or open gate items carried into execution. This
// module surfaces that commercial execution risk *inside* portfolio
// governance, not in a separate Source silo.
//
// No clock, no randomness, no I/O — the upstream slices own all data
// access; this is a pure re-projection of already-built artifacts.

import type {
  HandoffDelta,
  HandoffReadiness,
  SourceToMoveHandoff,
} from '@/lib/source/handoff/source-to-move-handoff-types';
import type { OutcomeLedgerView } from '@/lib/tower/outcome-ledger';
import {
  SOURCE_RISK_LEVELS,
  type MoveSourceRisk,
  type SourceRiskDriver,
  type SourceRiskLevel,
  type SourceRiskSummary,
  type SourceRiskView,
  type SourceRiskViewInput,
} from './types';

/**
 * Material-cost-gap threshold, in USD. A net adverse cost swing at or
 * above this lifts an otherwise-`watch` Move to `exposed`. Fixed so the
 * builder stays deterministic and threshold-explicit.
 */
const MATERIAL_COST_GAP_USD = 250_000;

/** Ordering weight per risk level — higher sorts first. */
const RISK_ORDER: Record<SourceRiskLevel, number> = {
  blocked: 3,
  exposed: 2,
  watch: 1,
  clear: 0,
};

// ---------------------------------------------------------------------
// Per-Move projection
// ---------------------------------------------------------------------

/** Adverse handoff deltas — the dimensions the Move must rebaseline. */
function adverseDeltas(handoff: SourceToMoveHandoff): readonly HandoffDelta[] {
  return handoff.deltas.filter((d) => d.direction === 'adverse');
}

/**
 * Net adverse cost exposure, in USD: the sum of positive USD swings
 * across the handoff's adverse `cost`-dimension deltas. Favorable cost
 * deltas (headroom) are intentionally excluded — exposure is the gap a
 * Move must fund, not netted-off savings.
 */
function costExposureUsd(handoff: SourceToMoveHandoff): number {
  return handoff.deltas
    .filter((d) => d.dimension === 'cost' && d.direction === 'adverse')
    .reduce((sum, d) => sum + Math.max(0, d.deltaUsd ?? 0), 0);
}

/**
 * Classify the coarse sourcing-risk level for one handoff.
 *
 * - `blocked` — the handoff is not ready; the Move should not mobilize.
 * - `exposed` — there are adverse deltas the Move must rebaseline, or a
 *               material adverse cost gap.
 * - `watch`   — open gate items follow into execution, or a sub-material
 *               adverse cost gap exists.
 * - `clear`   — firm, aligned, no adverse deltas and no open items.
 */
function classifyRiskLevel(
  readiness: HandoffReadiness,
  adverse: readonly HandoffDelta[],
  costGapUsd: number,
  openItemCount: number,
): SourceRiskLevel {
  if (readiness === 'not_ready') return 'blocked';

  const nonCostAdverse = adverse.some((d) => d.dimension !== 'cost');
  const materialCostGap = costGapUsd >= MATERIAL_COST_GAP_USD;
  if (nonCostAdverse || materialCostGap) return 'exposed';

  if (openItemCount > 0 || adverse.length > 0) return 'watch';
  return 'clear';
}

/** Build the risk drivers from the adverse deltas and carried open items. */
function buildDrivers(handoff: SourceToMoveHandoff): SourceRiskDriver[] {
  const drivers: SourceRiskDriver[] = adverseDeltas(handoff).map((d) => ({
    dimension: d.dimension,
    title: d.title,
    implication: d.implication,
    deltaUsd: d.deltaUsd,
  }));

  for (const item of handoff.carriedOpenItems) {
    drivers.push({
      dimension: 'risk',
      title: `Open gate item carried into execution: ${item.question}`,
      implication: item.whyItMatters,
      deltaUsd: null,
    });
  }

  return drivers;
}

/**
 * Compose the one-line Tower readout joining portfolio value posture
 * and sourcing risk — the sentence a CXO acts on.
 */
function buildTowerReadout(
  riskLevel: SourceRiskLevel,
  hasLedgerValueClaim: boolean,
  costGapUsd: number,
  openItemCount: number,
): string {
  if (riskLevel === 'clear') {
    return hasLedgerValueClaim
      ? 'Portfolio value is tracked and the sourcing decision behind this Move is firm — no commercial execution risk to escalate.'
      : 'The sourcing decision behind this Move is firm and aligned to its charter — no commercial execution risk to escalate.';
  }

  const valueClause = hasLedgerValueClaim
    ? 'This Move carries a portfolio value claim, so its outcome health reads fine — but '
    : 'This Move ';

  if (riskLevel === 'blocked') {
    return `${valueClause}the sourcing decision it depends on is not ready: the delivery-model gate is unresolved and the Move should not be mobilizing against it.`;
  }

  if (riskLevel === 'exposed') {
    const costPhrase =
      costGapUsd > 0
        ? ` and a ${formatUsd(costGapUsd)} should-cost gap against the chartered budget`
        : '';
    return `${valueClause}the vendor delivery posture behind it is the real risk: adverse sourcing deltas${costPhrase} must be rebaselined before this Move's portfolio status can be trusted.`;
  }

  // watch
  const openPhrase =
    openItemCount > 0
      ? `${openItemCount} open gate item(s) follow the sourcing handoff into execution`
      : 'a should-cost gap against the chartered budget';
  return `${valueClause}has manageable sourcing risk to track: ${openPhrase}.`;
}

/**
 * Project one Slice 1.6 handoff into a per-Move sourcing-risk row,
 * joined against the outcome ledger value-claim set.
 *
 * @param handoff the Slice 1.6 Source-to-Move handoff record.
 * @param movesWithLedgerValue set of Move ids that carry an outcome
 *   ledger value claim for the tenant.
 */
export function toMoveSourceRisk(
  handoff: SourceToMoveHandoff,
  movesWithLedgerValue: ReadonlySet<string>,
): MoveSourceRisk {
  const adverse = adverseDeltas(handoff);
  const costGapUsd = costExposureUsd(handoff);
  const openItemCount = handoff.carriedOpenItems.length;
  const riskLevel = classifyRiskLevel(
    handoff.readiness,
    adverse,
    costGapUsd,
    openItemCount,
  );
  const hasLedgerValueClaim = movesWithLedgerValue.has(handoff.targetMoveId);

  return {
    moveId: handoff.targetMoveId,
    eventId: handoff.eventId,
    eventLabel: handoff.eventLabel,
    riskLevel,
    readiness: handoff.readiness,
    recommendedDeliveryModel: handoff.recommendedDeliveryModel,
    plannedCostUsd: handoff.plannedCostUsd,
    costExposureUsd: costGapUsd,
    drivers: buildDrivers(handoff),
    carriedOpenItemCount: openItemCount,
    hasLedgerValueClaim,
    towerReadout: buildTowerReadout(
      riskLevel,
      hasLedgerValueClaim,
      costGapUsd,
      openItemCount,
    ),
  };
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

function emptyRiskLevelCounts(): Record<SourceRiskLevel, number> {
  return { clear: 0, watch: 0, exposed: 0, blocked: 0 };
}

/**
 * Build the reconciled summary over a set of per-Move rows.
 *
 * Reconciliation guarantees (test-enforced):
 * - `sum(byRiskLevel) === movesInScope`.
 * - every canonical risk level is present (0 allowed).
 */
export function summarizeSourceRisk(
  moves: readonly MoveSourceRisk[],
): SourceRiskSummary {
  const byRiskLevel = emptyRiskLevelCounts();
  let totalCostExposureUsd = 0;
  let valueClaimingButSourcingExposedCount = 0;

  for (const move of moves) {
    byRiskLevel[move.riskLevel] += 1;
    totalCostExposureUsd += move.costExposureUsd;
    if (
      move.hasLedgerValueClaim &&
      (move.riskLevel === 'exposed' || move.riskLevel === 'blocked')
    ) {
      valueClaimingButSourcingExposedCount += 1;
    }
  }

  return {
    movesInScope: moves.length,
    byRiskLevel,
    totalCostExposureUsd,
    valueClaimingButSourcingExposedCount,
  };
}

// ---------------------------------------------------------------------
// Top-level builder
// ---------------------------------------------------------------------

/**
 * Build the set of Move ids that carry a `move`-subject outcome ledger
 * value claim — the "portfolio shows a value figure" population the
 * source-risk join contrasts against.
 */
function movesWithLedgerValueClaim(
  ledger: OutcomeLedgerView,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const entry of ledger.entries) {
    if (entry.subjectKind === 'move') ids.add(entry.subjectRef);
  }
  return ids;
}

/**
 * Build the full Tower-facing source-risk view model for one tenant.
 *
 * Joins the Slice 1.6 handoff records to the Slice 3.1 outcome ledger
 * by Move id, projects each into a per-Move risk row, then sorts
 * most-exposed first (blocked > exposed > watch > clear), tie-breaking
 * by descending cost exposure then by Move id for determinism.
 */
export function buildSourceRiskView(
  input: SourceRiskViewInput,
): SourceRiskView {
  const { tenantClientKey, handoffs, ledger } = input;
  const movesWithValue = movesWithLedgerValueClaim(ledger);

  const moves = handoffs
    .map((h) => toMoveSourceRisk(h, movesWithValue))
    .sort((a, b) => {
      const order = RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel];
      if (order !== 0) return order;
      if (a.costExposureUsd !== b.costExposureUsd) {
        return b.costExposureUsd - a.costExposureUsd;
      }
      return a.moveId.localeCompare(b.moveId);
    });

  return {
    tenantClientKey,
    moves,
    summary: summarizeSourceRisk(moves),
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

const MAX_ABS = Number.MAX_SAFE_INTEGER;

function formatUsd(value: number): string {
  const safe = Math.max(-MAX_ABS, Math.min(MAX_ABS, Math.round(value)));
  const sign = safe < 0 ? '-' : '';
  return `${sign}$${Math.abs(safe).toLocaleString('en-US')}`;
}

/** Re-exported canonical tuple for callers that need the key list. */
export { SOURCE_RISK_LEVELS };
