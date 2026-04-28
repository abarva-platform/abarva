// executive-decision-queue-view.ts — TOWER2
//
// Deterministic view model for the Executive Decision Queue in the Control Tower.
//
// Answers: "What does the user need to know or do next?"
//
// Shows decisions requiring leadership attention across Source and Programs,
// with urgency, decision context, recommended action, and known/missing/blocked status.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.

// ─── Output types ─────────────────────────────────────────────────────────────

export type DecisionUrgency = 'immediate' | 'this_week' | 'this_month' | 'monitor';

export type DecisionDomain = 'source' | 'programs' | 'cross_domain';

export type DecisionStatus = 'open' | 'pending_input' | 'blocked' | 'ready_to_close';

export interface DecisionBlocker {
  blockerId: string;
  label: string;
  owner: string;
}

export interface DecisionItem {
  decisionId: string;
  domain: DecisionDomain;
  urgency: DecisionUrgency;
  status: DecisionStatus;
  title: string;
  /** Context for why this decision needs leadership attention. */
  context: string;
  /** What leadership needs to decide or do. */
  decisionQuestion: string;
  /** Atlas recommended action. */
  recommendedAction: string;
  /** What is known and can be relied upon. */
  knownContext: string[];
  /** What information is missing that would improve confidence. */
  missingContext: string[];
  /** Active blockers that must be resolved. */
  blockers: DecisionBlocker[];
  /** Decision owner — who needs to take action. */
  owner: string;
  /** Deadline or target date. */
  deadline: string;
}

export interface DecisionQueueSummary {
  immediateCount: number;
  thisWeekCount: number;
  openCount: number;
  blockedCount: number;
  /** Whether any immediate decision has an active blocker. */
  criticalBlockerActive: boolean;
}

export interface ExecutiveDecisionQueueView {
  headline: string;
  contextLine: string;
  summary: DecisionQueueSummary;
  decisions: DecisionItem[];
  /** Cross-domain executive guidance. */
  executiveSummary: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const DECISIONS: DecisionItem[] = [
  {
    decisionId: 'dec-ams-vendor-selection',
    domain: 'source',
    urgency: 'immediate',
    status: 'blocked',
    title: 'AMS vendor selection — Vendor B SOC-2 blocker',
    context:
      'AMS Vendor Consolidation 2026 is at BAFO stage. Selection committee cannot make a defensible recommendation until Vendor B\'s SOC-2 Type II attestation gap is resolved. Deadline is May 2, 2026.',
    decisionQuestion:
      'Does the selection committee proceed without Vendor B, or hold until May 2 to see if the SOC-2 gap is resolved?',
    recommendedAction:
      'Escalate to Vendor B procurement contact by Apr 30. If no commitment received by May 2, recommend selection committee proceed with Vendor A and Vendor C only.',
    knownContext: [
      'Vendor A is partially comparable — YR2+ $2.1M, 0 blockers',
      'Vendor C scope needs validation — YR2+ $1.8M, 1 blocker',
      'BAFO deadline is May 15, 2026',
    ],
    missingContext: [
      'Vendor B SOC-2 Type II attestation report',
      'Vendor C scope confirmation on 160-application basis',
    ],
    blockers: [
      {
        blockerId: 'b-ams-soc2',
        label: 'Vendor B SOC-2 Type II attestation outstanding',
        owner: 'Procurement Lead',
      },
    ],
    owner: 'CIO / Head of Procurement',
    deadline: 'May 2, 2026',
  },
  {
    decisionId: 'dec-cdp-gate',
    domain: 'programs',
    urgency: 'immediate',
    status: 'pending_input',
    title: 'APX-CDP-2026 P3 Design gate — pending gate criteria resolution',
    context:
      'APX-CDP-2026 Phase 3 Design gate is pending. Unmet gate criteria are blocking program progress. The gate status also directly impacts AMS vendor selection scope lock-in.',
    decisionQuestion:
      'Should the program director escalate gate blockers now, or wait for the next scheduled review cycle on May 8?',
    recommendedAction:
      'Convene an out-of-cycle gate review before May 5 to unblock the gate before AMS award decision is needed. Waiting until May 8 risks a cascade delay on AMS selection.',
    knownContext: [
      'Design gate status: pending',
      'AMS vendor selection depends on CDP scope confirmation',
      'Phase 3 Design is the current viewing phase',
    ],
    missingContext: [
      'Which specific gate criteria are unmet',
      'Whether a waiver is feasible for any criteria',
    ],
    blockers: [],
    owner: 'Program Director',
    deadline: 'May 5, 2026',
  },
  {
    decisionId: 'dec-ams-vendor-c-scope',
    domain: 'source',
    urgency: 'this_week',
    status: 'open',
    title: 'Vendor C scope validation — confirm below-median pricing basis',
    context:
      'Vendor C\'s BAFO price ($1.8M YR2+) is 14% below market median. Before using as competitive leverage with Vendor A, the scope basis must be confirmed. If Vendor C is disqualified on scope, the negotiation strategy for Vendor A must be revised.',
    decisionQuestion:
      'Proceed with issuing scope confirmation to Vendor C, or first brief the CIO on the pricing risk before issuing?',
    recommendedAction:
      'Issue scope confirmation request to Vendor C by May 5 without waiting for CIO briefing — the risk is in not validating, not in requesting confirmation.',
    knownContext: [
      'Vendor C assumes 155 applications vs. RFP baseline of 160',
      'Vendor C scope confirmed governance at minimum threshold',
      'BAFO clarification deadline is May 10',
    ],
    missingContext: [
      'Written confirmation from Vendor C on scope basis',
      'Explanation of below-median pricing positioning',
    ],
    blockers: [],
    owner: 'Commercial Lead',
    deadline: 'May 5, 2026',
  },
  {
    decisionId: 'dec-ams-cdp-award-hold',
    domain: 'cross_domain',
    urgency: 'this_week',
    status: 'open',
    title: 'AMS Award hold — CDP gate alignment decision',
    context:
      'If APX-CDP-2026 Design gate slips beyond May 15, the AMS Award stage may need to hold to avoid vendor architecture lock-in with a scope that doesn\'t match CDP Phase 3 design. This is a cross-domain scheduling risk that requires a joint decision.',
    decisionQuestion:
      'At what CDP gate delay threshold should the AMS Award date be pushed out? Is there a conditional award option?',
    recommendedAction:
      'Define a decision rule now: if CDP Design gate is not resolved by May 15, AMS Award automatically shifts to June 1. Document this in the steering committee minutes before May 8.',
    knownContext: [
      'AMS BAFO deadline May 15 — selection committee decision follows shortly after',
      'CDP Design gate is currently pending',
      'Vendor A architecture is the most compatible with CDP scope',
    ],
    missingContext: [
      'Conditional award clause feasibility in AMS procurement framework',
      'CDP gate resolution date estimate from Program Director',
    ],
    blockers: [],
    owner: 'Program Director + CIO',
    deadline: 'May 8, 2026',
  },
  {
    decisionId: 'dec-ams-bafo-instruction',
    domain: 'source',
    urgency: 'this_week',
    status: 'open',
    title: 'BAFO application count standardisation — issue instruction to all vendors',
    context:
      'Vendor A scoped 160 applications, Vendor B 142, Vendor C 155. Without a standardised basis, the selection committee cannot make a comparable recommendation. A joint clarification instruction is needed before May 10.',
    decisionQuestion:
      'Confirm the RFP baseline is 160 applications and issue clarification instruction to all three vendors.',
    recommendedAction:
      'Commercial Lead to issue BAFO clarification instruction by May 8, requiring all vendors to reconfirm price on 160-application basis.',
    knownContext: [
      'RFP scope: 160 applications',
      'All three vendors have confirmed interest in BAFO round',
    ],
    missingContext: [
      'Vendor B confirmation (may be affected by SOC-2 status)',
    ],
    blockers: [],
    owner: 'Commercial Lead',
    deadline: 'May 8, 2026',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the executive decision queue view for the Control Tower.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildExecutiveDecisionQueueView(): ExecutiveDecisionQueueView {
  const immediateCount = DECISIONS.filter((d) => d.urgency === 'immediate').length;
  const thisWeekCount = DECISIONS.filter((d) => d.urgency === 'this_week').length;
  const openCount = DECISIONS.filter((d) => d.status === 'open').length;
  const blockedCount = DECISIONS.filter((d) => d.status === 'blocked').length;
  const criticalBlockerActive = DECISIONS.some(
    (d) => d.urgency === 'immediate' && d.blockers.length > 0,
  );

  const summary: DecisionQueueSummary = {
    immediateCount,
    thisWeekCount,
    openCount,
    blockedCount,
    criticalBlockerActive,
  };

  return {
    headline: 'Executive decision queue',
    contextLine: `${DECISIONS.length} decisions requiring leadership attention · ${immediateCount} immediate · ${thisWeekCount} this week`,
    summary,
    decisions: DECISIONS,
    executiveSummary:
      'Two decisions require action before May 2: (1) Escalate Vendor B SOC-2 requirement — if unresolved, the selection committee must decide whether to proceed without Vendor B. (2) Convene an out-of-cycle CDP gate review — delaying until May 8 creates a cascade risk on AMS Award timing.',
    honestDisclaimer:
      'Deterministic seed · Decision queue reflects fixture context for APX-CDP-2026 and SRC-AMS-2026 only. ' +
      'Live gate state, vendor submission status, and programme escalations are deferred.',
    deterministicSeed: true,
  };
}
