// Move portfolio card · GAP-4 — Source -> Tower display residual.
//
// The end-to-end loop (Context -> Intelligence -> Move -> Source ->
// Tower -> Outcome) is wired hand-off by hand-off, but one display
// residual remained: a Move that has flowed through the loop did not
// appear as a first-class card in the Tower portfolio surface. The
// Source -> Tower handoff data was wired (the `tower-source-handoff-panel`)
// and the cross-module trace viewer (`/strategic-moves/[moveId]/trace`)
// showed the linkage — but the portfolio surface itself never rendered
// the Move as a portfolio line item.
//
// This module closes that residual. It is a PURE re-projection: it
// composes the already-built outputs of three Tower modules —
//   * `outcome-ledger`            (the value-claim status of the Move),
//   * `source-risk`               (the sourcing-risk posture of the Move),
//   * `adoption-realization-view` (adoption + benefit-realization read),
// — into a single `MovePortfolioCard` a CXO can read at a glance and
// click into (the Move, and its cross-module trace).
//
// No clock, no randomness, no I/O. The upstream modules own all data
// access; this module joins their outputs by Move id.

import type { OutcomeLedgerView, OutcomeValueTier } from '@/lib/tower/outcome-ledger';
import type {
  MoveSourceRisk,
  SourceRiskLevel,
  SourceRiskView,
} from '@/lib/tower/source-risk';
import type { TowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger';

// ── Output ───────────────────────────────────────────────────────────────────

/**
 * The headline outcome-ledger posture of the Move, read at a glance.
 *
 * - `none`       — the Move carries no outcome-ledger value claim yet.
 * - `projected`  — a claimed figure with no measurement behind it.
 * - `tracked`    — a baseline exists / pilot measurement is under way.
 * - `verified`   — the value is measured (pilot or production).
 *
 * Where a Move carries entries at more than one tier the strongest tier
 * present wins, so the card never under-states realized value.
 */
export type MoveLedgerStatus = 'none' | OutcomeValueTier;

/** One navigable link off the portfolio card. */
export interface MovePortfolioCardLink {
  /** Stable id, unique within the card. */
  readonly id: string;
  /** Short link label. */
  readonly label: string;
  /** App-relative href. */
  readonly href: string;
}

/**
 * A Move rendered as a first-class Tower portfolio card.
 *
 * The card joins three reads by Move id: the outcome-ledger value
 * claim (status + projected value), the source-risk posture (the
 * commercial execution risk the Move inherits from its sourcing
 * decision), and the adoption + benefit-realization signal.
 */
export interface MovePortfolioCard {
  /** The Move id — the join key into every Tower read. */
  readonly moveId: string;
  /** Human-readable Move name. */
  readonly moveName: string;
  /** Current phase label, e.g. `P3 Design`. */
  readonly phaseLabel: string;
  /** Outcome-ledger status — the strongest value tier the Move carries. */
  readonly ledgerStatus: MoveLedgerStatus;
  /**
   * Total projected value across the Move's outcome-ledger entries,
   * in USD. 0 when the Move carries no value claim.
   */
  readonly projectedValueUsd: number;
  /**
   * Sourcing-risk posture lifted from the source-risk join, or `null`
   * when no Source handoff is linked to the Move.
   */
  readonly sourceRiskLevel: SourceRiskLevel | null;
  /**
   * One-line Tower readout joining portfolio value posture and sourcing
   * risk — the sentence a CXO acts on. `null` when no Source handoff.
   */
  readonly sourceRiskReadout: string | null;
  /** Net adverse should-cost exposure inherited from sourcing, in USD. */
  readonly sourceCostExposureUsd: number;
  /**
   * The adoption + benefit-realization one-liner — answers "is this
   * Move actually earning?". Sourced from `adoption-realization-view`.
   */
  readonly earningSummary: string;
  /** Navigable links — into the Move, and into its cross-module trace. */
  readonly links: readonly MovePortfolioCardLink[];
}

// ── Input ────────────────────────────────────────────────────────────────────

/** A Move the Tower portfolio should render as a card. */
export interface PortfolioMoveRef {
  /** The Move id — the join key into the Tower reads. */
  readonly moveId: string;
  /** Human-readable Move name. */
  readonly moveName: string;
  /** Current phase label, e.g. `P3 Design`. */
  readonly phaseLabel: string;
}

/** Input to the portfolio-card builder for one tenant. */
export interface MovePortfolioCardInput {
  /** The Moves to surface as portfolio cards. */
  readonly moves: readonly PortfolioMoveRef[];
  /** Slice 3.1 outcome-ledger view for the tenant. */
  readonly ledger: OutcomeLedgerView;
  /** Slice 3.3 source-risk view for the tenant. */
  readonly sourceRisk: SourceRiskView;
  /** Slice 3.4 adoption + benefit-realization view for the tenant. */
  readonly adoptionRealization: TowerAdoptionRealizationView;
}

// ── Builder ──────────────────────────────────────────────────────────────────

/** Tier strength ordering — the strongest tier present on a Move wins. */
const TIER_RANK: Record<OutcomeValueTier, number> = {
  projected: 0,
  tracked: 1,
  verified: 2,
};

/**
 * Resolve the headline ledger status for one Move: the strongest value
 * tier across its `move`-subject outcome-ledger entries, or `none` when
 * the Move carries no value claim.
 */
function resolveLedgerStatus(
  moveId: string,
  ledger: OutcomeLedgerView,
): { status: MoveLedgerStatus; projectedValueUsd: number } {
  let status: MoveLedgerStatus = 'none';
  let bestRank = -1;
  let projectedValueUsd = 0;

  for (const entry of ledger.entries) {
    if (entry.subjectKind !== 'move' || entry.subjectRef !== moveId) continue;
    projectedValueUsd += entry.projectedAmount;
    const rank = TIER_RANK[entry.valueTier];
    if (rank > bestRank) {
      bestRank = rank;
      status = entry.valueTier;
    }
  }

  return { status, projectedValueUsd };
}

/** Find the source-risk row for one Move, or `null` when not linked. */
function findSourceRisk(
  moveId: string,
  sourceRisk: SourceRiskView,
): MoveSourceRisk | null {
  return sourceRisk.moves.find((m) => m.moveId === moveId) ?? null;
}

/**
 * Project one Move into a Tower portfolio card.
 *
 * @param move the Move to render.
 * @param input the joined Tower reads for the tenant.
 */
export function buildMovePortfolioCard(
  move: PortfolioMoveRef,
  input: MovePortfolioCardInput,
): MovePortfolioCard {
  const { status, projectedValueUsd } = resolveLedgerStatus(
    move.moveId,
    input.ledger,
  );
  const risk = findSourceRisk(move.moveId, input.sourceRisk);

  const links: MovePortfolioCardLink[] = [
    {
      id: 'open-move',
      label: 'Open Move',
      href: `/strategic-moves/${move.moveId}`,
    },
    {
      id: 'open-trace',
      label: 'View decision trace',
      href: `/strategic-moves/${move.moveId}/trace`,
    },
  ];

  return {
    moveId: move.moveId,
    moveName: move.moveName,
    phaseLabel: move.phaseLabel,
    ledgerStatus: status,
    projectedValueUsd,
    sourceRiskLevel: risk?.riskLevel ?? null,
    sourceRiskReadout: risk?.towerReadout ?? null,
    sourceCostExposureUsd: risk?.costExposureUsd ?? 0,
    earningSummary: input.adoptionRealization.earningSummary,
    links,
  };
}

/**
 * Build the full set of Tower portfolio cards for one tenant — one card
 * per Move in `input.moves`, in input order.
 */
export function buildMovePortfolioCards(
  input: MovePortfolioCardInput,
): readonly MovePortfolioCard[] {
  return input.moves.map((move) => buildMovePortfolioCard(move, input));
}
