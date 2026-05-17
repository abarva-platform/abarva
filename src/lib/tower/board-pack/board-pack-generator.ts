// Tower · Wave 3, Slice 3.5 — Board/ELT pack generator.
//
// Tower has the portfolio, the value-realization read model (Slice 3.4)
// and the ranked intervention queue (Slice 3.2). What a CXO actually
// walks into a board or ELT meeting with, though, is none of those —
// it is a one-pager: what we decided, what is at stake, what changed,
// what we need from you, and where the evidence sits.
//
// This module is that artifact. It is a PURE composition over three
// already-built inputs:
//
//   - the Slice 3.1 outcome ledger view (`OutcomeLedgerView`),
//   - the Slice 3.4 adoption + value-realization view
//     (`TowerAdoptionRealizationView`), and
//   - the Slice 3.2 executive action queue (`ExecutiveActionQueue`).
//
// It performs NO new I/O, holds NO clock and NO randomness — given the
// same three inputs it returns a byte-identical pack, so the golden
// snapshot test is stable.
//
// No-fabrication contract (inherited from the taxonomy and 3.4):
//
//   - Every dollar figure in the pack traces to a ledger entry. The
//     pack never invents a number.
//   - "Earned" value is only verified-AND-evidenced value, exactly as
//     Slice 3.4 defines it. Unevidenced verified-tier claims are
//     surfaced as a challenge line, not folded into the headline total.
//   - Spend at risk is committed projected value that is not yet
//     verified-and-evidenced — the budget a CXO should consider
//     reallocating. It is computed from the ledger, never assumed.

import type { OutcomeLedgerView } from '@/lib/tower/outcome-ledger/types';
import type { TowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger/adoption-realization-view';
import type {
  ExecutiveActionQueue,
  ExecutiveAction,
} from '@/lib/tower/action-queue/executive-action-queue';

// ---------------------------------------------------------------------
// Public pack shapes
// ---------------------------------------------------------------------

/** A board-level decision the portfolio is asking leadership to ratify. */
export interface BoardDecisionItem {
  /** Stable id of the form `bd-{entryId}`. */
  readonly id: string;
  /** Initiative the decision concerns. */
  readonly initiative: string;
  /** The decision being put to the board, in plain language. */
  readonly decision: string;
  /** Why it reaches the board — the executive stake. */
  readonly rationale: string;
  /** Severity bucket, carried through from the action queue. */
  readonly severity: ExecutiveAction['severity'];
}

/** The spend-at-risk line — committed value not yet defensibly earned. */
export interface BoardSpendAtRisk {
  /** Total projected value committed across the portfolio, USD-seed. */
  readonly totalCommittedAmount: number;
  /** Verified-and-evidenced value — the only defensibly earned figure. */
  readonly earnedVerifiedAmount: number;
  /**
   * Committed value that is NOT verified-and-evidenced. This is the
   * budget a CXO should weigh reallocating away from non-earning bets.
   */
  readonly spendAtRiskAmount: number;
  /**
   * Verified-tier value claimed as earned but carrying no evidence —
   * called out separately so the board challenges it rather than banks
   * it.
   */
  readonly unevidencedClaimedAmount: number;
  /** Plain-English line for the pack. */
  readonly headline: string;
}

/** A value change the board should be aware of since the last review. */
export interface BoardValueChangeItem {
  /** Realization ratio as a 0..1 share, or null when uncomputable. */
  readonly realizationRatio: number | null;
  /** Severity band for the realization ratio. */
  readonly severity: TowerAdoptionRealizationView['valueRealization']['severity'];
  /** The "is the portfolio earning?" line, sourced from Slice 3.4. */
  readonly earningSummary: string;
  /** Adoption posture line, sourced from Slice 3.4. */
  readonly adoptionHeadline: string;
  /** True when adoption telemetry is not yet bound. */
  readonly adoptionInstrumentationGap: boolean;
}

/** An action the board/ELT is being asked to take or sponsor. */
export interface BoardActionRequiredItem {
  /** Stable id, carried from the action queue. */
  readonly id: string;
  /** Initiative the action concerns. */
  readonly initiative: string;
  /** The implied next action — a decision, not another status meeting. */
  readonly action: string;
  /** Severity bucket. */
  readonly severity: ExecutiveAction['severity'];
}

/** A pointer to the evidence behind a claim in the pack. */
export interface BoardEvidenceLink {
  /** Initiative the evidence supports. */
  readonly initiative: string;
  /** The ledger entry id the evidence attaches to. */
  readonly entryId: string;
  /**
   * Evidence reference: an evidence pointer, a count of claim ids, or
   * an explicit "no evidence bound" gap marker.
   */
  readonly reference: string;
  /** True when the entry carries no evidence at all. */
  readonly isGap: boolean;
}

/** The assembled board/ELT one-pager. */
export interface BoardPack {
  readonly tenantClientKey: string;
  /** One-line framing for the top of the pack. */
  readonly headline: string;
  /** Top decisions the board is asked to ratify (most severe first). */
  readonly topDecisions: readonly BoardDecisionItem[];
  /** The spend-at-risk summary. */
  readonly spendAtRisk: BoardSpendAtRisk;
  /** The value-change summary since last review. */
  readonly valueChange: BoardValueChangeItem;
  /** Actions the board/ELT is asked to take or sponsor. */
  readonly actionsRequired: readonly BoardActionRequiredItem[];
  /** Evidence links / gaps backing the figures in the pack. */
  readonly evidenceLinks: readonly BoardEvidenceLink[];
  /** Honesty disclaimer — the pack is a deterministic composition. */
  readonly disclaimer: string;
  /** Provenance marker. */
  readonly deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

/**
 * Maximum decisions / actions surfaced on the one-pager. A board pack
 * is a one-pager by definition — the long tail lives in the Tower
 * surface, not the pack.
 */
const MAX_BOARD_ITEMS = 5;

const PACK_DISCLAIMER =
  'Deterministic composition · This board pack is assembled purely from the Tower outcome ledger, ' +
  'the adoption & value-realization view (Slice 3.4) and the executive action queue (Slice 3.2). ' +
  'It introduces no new figures — every number traces to a ledger entry.';

// ---------------------------------------------------------------------
// Formatting helpers (pure)
// ---------------------------------------------------------------------

function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ---------------------------------------------------------------------
// Section builders (pure)
// ---------------------------------------------------------------------

/**
 * The decisions the board is asked to ratify. Every actionable item in
 * the executive action queue is a candidate decision; the queue is
 * already ranked severity-first and deterministically tiebroken, so the
 * pack just takes the top `MAX_BOARD_ITEMS`.
 */
export function buildBoardDecisions(
  queue: ExecutiveActionQueue,
): readonly BoardDecisionItem[] {
  return queue.actions.slice(0, MAX_BOARD_ITEMS).map((action) => ({
    id: `bd-${action.entryId}`,
    initiative: action.initiative,
    decision: `${action.triggerLabel} — ${action.impliedAction}`,
    rationale: action.whyItMatters,
    severity: action.severity,
  }));
}

/**
 * The spend-at-risk line. Committed value is the sum of every entry's
 * projected amount; earned value is the Slice 3.4 verified-and-
 * evidenced figure; spend at risk is the difference, floored at zero.
 */
export function buildBoardSpendAtRisk(
  realization: TowerAdoptionRealizationView,
): BoardSpendAtRisk {
  const v = realization.valueRealization;
  const totalCommittedAmount = v.totalProjectedAmount;
  const earnedVerifiedAmount = v.earnedVerifiedAmount;
  const spendAtRiskAmount = Math.max(
    0,
    totalCommittedAmount - earnedVerifiedAmount,
  );
  const unevidencedClaimedAmount = v.unevidencedVerifiedAmount;

  const headline =
    totalCommittedAmount === 0
      ? 'No committed value is recorded in the outcome ledger — spend at risk cannot be computed.'
      : `${formatUsd(spendAtRiskAmount)} of ${formatUsd(
          totalCommittedAmount,
        )} committed value is not yet verified and evidence-backed` +
        (unevidencedClaimedAmount > 0
          ? `; a further ${formatUsd(
              unevidencedClaimedAmount,
            )} is claimed verified but unevidenced and should be challenged.`
          : '.');

  return {
    totalCommittedAmount,
    earnedVerifiedAmount,
    spendAtRiskAmount,
    unevidencedClaimedAmount,
    headline,
  };
}

/**
 * The value-change summary. This is a thin re-projection of the Slice
 * 3.4 view so the board reads exactly the same earning narrative the
 * Tower surface shows — no re-derivation, no drift.
 */
export function buildBoardValueChange(
  realization: TowerAdoptionRealizationView,
): BoardValueChangeItem {
  return {
    realizationRatio: realization.valueRealization.realizationRatio,
    severity: realization.valueRealization.severity,
    earningSummary: realization.earningSummary,
    adoptionHeadline: realization.adoption.headline,
    adoptionInstrumentationGap: realization.adoption.instrumentationGap,
  };
}

/**
 * The actions the board/ELT is asked to take. Drawn from the same
 * ranked queue as the decisions, but framed as the imperative ask.
 */
export function buildBoardActionsRequired(
  queue: ExecutiveActionQueue,
): readonly BoardActionRequiredItem[] {
  return queue.actions.slice(0, MAX_BOARD_ITEMS).map((action) => ({
    id: action.id,
    initiative: action.initiative,
    action: action.impliedAction,
    severity: action.severity,
  }));
}

/**
 * The evidence links backing the figures. One entry per current ledger
 * row; rows with an evidence pointer or ≥ 1 claim id resolve to a
 * reference, the rest are explicit gap markers so the board never
 * mistakes silence for evidence.
 */
export function buildBoardEvidenceLinks(
  ledger: OutcomeLedgerView,
): readonly BoardEvidenceLink[] {
  return ledger.entries.map((entry) => {
    if (entry.evidencePointer) {
      return {
        initiative: entry.subjectLabel,
        entryId: entry.id,
        reference: entry.evidencePointer,
        isGap: false,
      };
    }
    if (entry.evidenceClaimIds.length > 0) {
      return {
        initiative: entry.subjectLabel,
        entryId: entry.id,
        reference: `${entry.evidenceClaimIds.length} evidence claim${
          entry.evidenceClaimIds.length === 1 ? '' : 's'
        } on file (${entry.evidenceClaimIds.join(', ')})`,
        isGap: false,
      };
    }
    return {
      initiative: entry.subjectLabel,
      entryId: entry.id,
      reference: 'No evidence bound — claim is not yet defensible.',
      isGap: true,
    };
  });
}

// ---------------------------------------------------------------------
// Pack composer
// ---------------------------------------------------------------------

/**
 * Compose the board/ELT one-pager from the three Tower inputs.
 *
 * Pure and deterministic: given the same outcome ledger view, Slice 3.4
 * adoption/value-realization view and Slice 3.2 action queue, this
 * returns a byte-identical pack. No clock, no randomness, no I/O.
 *
 * @param ledger      Slice 3.1 outcome ledger view for the tenant.
 * @param realization Slice 3.4 adoption + value-realization view.
 * @param queue       Slice 3.2 executive action queue.
 */
export function buildBoardPack(
  ledger: OutcomeLedgerView,
  realization: TowerAdoptionRealizationView,
  queue: ExecutiveActionQueue,
): BoardPack {
  const topDecisions = buildBoardDecisions(queue);
  const spendAtRisk = buildBoardSpendAtRisk(realization);
  const valueChange = buildBoardValueChange(realization);
  const actionsRequired = buildBoardActionsRequired(queue);
  const evidenceLinks = buildBoardEvidenceLinks(ledger);

  const evidenceGapCount = evidenceLinks.filter((link) => link.isGap).length;

  const decisionClause =
    topDecisions.length === 0
      ? 'no executive decisions are outstanding'
      : `${topDecisions.length} decision${
          topDecisions.length === 1 ? '' : 's'
        } need the board` +
        (queue.criticalCount > 0 ? ` · ${queue.criticalCount} critical` : '');

  const realizationClause =
    valueChange.realizationRatio === null
      ? 'value realization is not yet instrumented'
      : `${formatPercent(
          valueChange.realizationRatio,
        )} of projected value is verified and evidence-backed`;

  const headline =
    `Board pack · ${decisionClause}; ${realizationClause}; ` +
    `${formatUsd(spendAtRisk.spendAtRiskAmount)} of committed spend is at risk` +
    (evidenceGapCount > 0
      ? ` · ${evidenceGapCount} claim${
          evidenceGapCount === 1 ? '' : 's'
        } carry no evidence.`
      : '.');

  return {
    tenantClientKey: ledger.tenantClientKey,
    headline,
    topDecisions,
    spendAtRisk,
    valueChange,
    actionsRequired,
    evidenceLinks,
    disclaimer: PACK_DISCLAIMER,
    deterministicSeed: true,
  };
}
