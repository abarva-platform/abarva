// gate-approval-drawer-view.ts — PROG21
//
// Deterministic view model for the Gate approval interaction drawer.
//
// Answers: "Can this program move to the next phase?"
//
// Shows gate blockers, required evidence, approval posture, and waiver
// caveat — without fabricating approvals or issuing a real gate
// transition.  Every field derived from seed fixture data only.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.

import type { ProgramDetailView, EvidenceItem } from './programs-types';
import { PHASE_LABEL_MAP } from './programs-fixture';
import type { ProgramPhaseId } from './programs-types';

// ─── Output types ─────────────────────────────────────────────────────────────

/** Readiness classification for a single gate criterion row. */
export type GateCriterionStatus =
  | 'known'     // criterion met, evidence on file
  | 'missing'   // criterion not met, evidence absent or low-confidence
  | 'blocked';  // criterion not met AND a contradicting evidence item exists

/** Overall approval posture for the gate. */
export type GateApprovalPosture =
  | 'ready'             // all criteria met — Steward can clear without override
  | 'requires_override' // some unmet criteria — override rationale required
  | 'blocked'           // contradictions present — must resolve before approval
  | 'waiver_needed';    // hard gate with unresolvable block — waiver path only

export interface GateCriterionRow {
  /** The gate criterion text. */
  criterion: string;
  /** Whether the seed data marks this criterion as met. */
  met: boolean;
  /** Derived readiness status. */
  status: GateCriterionStatus;
  /** Citation strings from evidence items that support this criterion. */
  linkedEvidence: string[];
  /** What needs to happen next for this criterion. */
  nextAction: string;
}

export interface GateApprovalDrawerView {
  fromPhase: number;
  toPhase: number;
  fromPhaseLabel: string;
  toPhaseLabel: string;
  /** "P3 Design → P4 Execution Roadmap" */
  transitionLabel: string;
  approvalPosture: GateApprovalPosture;
  /** Human-readable posture label for the status badge. */
  postureLabel: string;
  criteriaRows: GateCriterionRow[];
  metCount: number;
  totalCount: number;
  /** e.g. "3 of 5 criteria met" */
  gateSummary: string;
  /**
   * Waiver caveat — always present.
   * In demo/seed context this is a fixed deterministic note;
   * in production it would reference the Steward waiver audit log.
   */
  waiverCaveat: string;
  /** Authority string — who must sign off. */
  approvalAuthority: string;
  /** Honest disclaimer: seed/deterministic context. */
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseLabel(id: number): string {
  return PHASE_LABEL_MAP[id as ProgramPhaseId] ?? `Phase ${id}`;
}

/**
 * Derive GateCriterionStatus from whether the criterion is met and
 * whether any contradiction exists in the evidence pool.
 *
 * Conservative rule:
 *  - met → 'known'
 *  - !met + contradiction → 'blocked'
 *  - !met + no contradiction → 'missing'
 */
function deriveStatus(
  met: boolean,
  hasContradiction: boolean,
): GateCriterionStatus {
  if (met) return 'known';
  if (hasContradiction) return 'blocked';
  return 'missing';
}

/**
 * Select the "next action" copy for a criterion row.
 */
function nextActionFor(status: GateCriterionStatus): string {
  switch (status) {
    case 'known':
      return 'Confirm with Steward';
    case 'missing':
      return 'Upload or link supporting evidence';
    case 'blocked':
      return 'Resolve contradiction before advancing';
  }
}

/**
 * Link evidence citations to a criterion.
 *
 * Strategy: attach high/medium-confidence items to 'known' criteria
 * (they're the supporting evidence), and surface low-confidence or
 * contradicting items against unmet criteria.  This is a
 * deterministic heuristic — no semantic matching.
 */
function linkEvidence(
  met: boolean,
  items: EvidenceItem[],
): string[] {
  if (!items || items.length === 0) return [];

  if (met) {
    // Supporting evidence: high/medium confidence, non-contradicting
    return items
      .filter((e) => e.confidence !== 'low' && !e.hasContradiction)
      .map((e) => e.citation)
      .slice(0, 3);
  } else {
    // Show any contradicting or low-confidence items as the reason it's unmet
    return items
      .filter((e) => e.hasContradiction || e.confidence === 'low')
      .map((e) => e.citation)
      .slice(0, 2);
  }
}

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the gate approval drawer view model from a ProgramDetailView.
 *
 * Returns null when:
 *  - gateStatus !== 'pending' (gate is not active for review)
 *  - phasePanel.gateCriteria is missing or empty
 *  - currentPhase >= 6 (Tower Handoff — no next phase)
 */
export function buildGateApprovalDrawerView(
  view: ProgramDetailView,
): GateApprovalDrawerView | null {
  if (view.gateStatus !== 'pending') return null;
  const { gateCriteria, evidenceItems } = view.phasePanel;
  if (!gateCriteria || gateCriteria.length === 0) return null;
  if (view.currentPhase >= 6) return null;

  const fromPhase = view.currentPhase;
  const toPhase = fromPhase + 1;
  const fromPhaseLabel = phaseLabel(fromPhase);
  const toPhaseLabel = phaseLabel(toPhase);
  const transitionLabel = `P${fromPhase} ${fromPhaseLabel} → P${toPhase} ${toPhaseLabel}`;

  const evidencePool = evidenceItems ?? [];
  const hasAnyContradiction = evidencePool.some((e) => e.hasContradiction);

  const criteriaRows: GateCriterionRow[] = gateCriteria.map((c) => {
    const status = deriveStatus(c.met, hasAnyContradiction && !c.met);
    return {
      criterion: c.criterion,
      met: c.met,
      status,
      linkedEvidence: linkEvidence(c.met, evidencePool),
      nextAction: nextActionFor(status),
    };
  });

  const metCount = criteriaRows.filter((r) => r.met).length;
  const totalCount = criteriaRows.length;
  const gateSummary = `${metCount} of ${totalCount} criteria met`;
  const blockedRows = criteriaRows.filter((r) => r.status === 'blocked');

  let approvalPosture: GateApprovalPosture;
  if (metCount === totalCount) {
    approvalPosture = 'ready';
  } else if (blockedRows.length > 0) {
    // Hard-gate programs (P3 Design exit is a canonical hard gate)
    approvalPosture = fromPhase === 3 ? 'waiver_needed' : 'blocked';
  } else {
    approvalPosture = 'requires_override';
  }

  const postureLabel: Record<GateApprovalPosture, string> = {
    ready: 'Ready for approval',
    requires_override: 'Override required',
    blocked: 'Blocked — resolve contradictions',
    waiver_needed: 'Waiver path required',
  };

  const waiverCaveat =
    'Waiver authority rests with the Steward role. ' +
    'Waivers are logged to the program audit trail and do not suppress ' +
    'gate score recalculation. This indicator is deterministic seed data ' +
    'and does not reflect a real waiver decision.';

  const approvalAuthority = 'Steward sign-off required';

  const honestDisclaimer =
    `Deterministic seed · ${view.displayId} P${fromPhase} gate readiness ` +
    `reflects fixture context only. Live gate state machine, Steward ` +
    `signoff persistence, and audit log are deferred.`;

  return {
    fromPhase,
    toPhase,
    fromPhaseLabel,
    toPhaseLabel,
    transitionLabel,
    approvalPosture,
    postureLabel: postureLabel[approvalPosture],
    criteriaRows,
    metCount,
    totalCount,
    gateSummary,
    waiverCaveat,
    approvalAuthority,
    honestDisclaimer,
    deterministicSeed: true,
  };
}
