// PDEL10 · Deliverable Approval / Lock / Supersede Flow.
//
// Pure deterministic approval-state machine projection. No model calls,
// no DB writes, no live runtime, no Date.now reads, no random IDs,
// no migrations.
//
// Every record is marked proposedOnly: true — this module defines the
// shape and transition rules for the approval workflow; no real approval
// state is persisted or mutated.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ApprovalState =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'locked';

export type LockReason =
  | 'approved_final'
  | 'board_presented'
  | 'client_signed_off'
  | 'archived';

export type SupersedeReason =
  | 'updated_evidence'
  | 'scope_change'
  | 'corrected_error'
  | 'strategic_pivot';

export type ReviewerRole =
  | 'maestro'
  | 'steward'
  | 'client_sponsor'
  | 'cxo_sponsor'
  | 'external_reviewer';

export type ApprovalBlocker =
  | 'missing_evidence'
  | 'unresolved_risk'
  | 'pending_review'
  | 'locked_by_prior'
  | 'needs_sponsor_signoff';

export interface ApprovalTransition {
  from: ApprovalState;
  to: ApprovalState;
  requiredRole: ReviewerRole;
  requiresRationale: boolean;
  requiresEvidenceTrace: boolean;
  auditBasis: string;
  isAllowed: boolean;
}

export interface DeliverableApprovalRecord {
  deliverableId: string;
  deliverableName: string;
  currentState: ApprovalState;
  allowedTransitions: ApprovalTransition[];
  blockers: ApprovalBlocker[];
  lockReason: LockReason | null;
  supersedeReason: SupersedeReason | null;
  isDecisionGrade: boolean;
  requiresEvidenceTrace: boolean;
  proposedOnly: true;
  auditBasis: string;
}

export interface DeliverableApprovalFlowManifest {
  generatedAt: string;
  totalDeliverables: number;
  approvedCount: number;
  pendingCount: number;
  lockedCount: number;
  proposedOnly: true;
  deliverables: DeliverableApprovalRecord[];
}

// ---------------------------------------------------------------------
// Canonical transition table
// ---------------------------------------------------------------------

/**
 * All legal approval transitions, with role, rationale, evidence trace,
 * and audit basis requirements. This is the source of truth for the
 * approval state machine contract.
 *
 * Rules:
 * - Lock and supersede always require rationale.
 * - Decision-grade deliverables always require evidence trace.
 * - Rejection from any active state always requires rationale.
 * - Self-transitions are not included.
 */
const TRANSITION_TABLE: ReadonlyArray<
  Omit<ApprovalTransition, 'isAllowed'>
> = [
  // draft → pending_review
  {
    from: 'draft',
    to: 'pending_review',
    requiredRole: 'maestro',
    requiresRationale: false,
    requiresEvidenceTrace: false,
    auditBasis:
      'Maestro submits draft for review; no evidence trace required at submission stage.',
  },
  // draft → rejected (early rejection by steward)
  {
    from: 'draft',
    to: 'rejected',
    requiredRole: 'steward',
    requiresRationale: true,
    requiresEvidenceTrace: false,
    auditBasis:
      'Steward rejects draft before review cycle; rationale required for audit trail.',
  },
  // pending_review → approved
  {
    from: 'pending_review',
    to: 'approved',
    requiredRole: 'steward',
    requiresRationale: true,
    requiresEvidenceTrace: true,
    auditBasis:
      'Steward approves deliverable after evidence-backed review; full rationale and evidence trace required.',
  },
  // pending_review → rejected
  {
    from: 'pending_review',
    to: 'rejected',
    requiredRole: 'steward',
    requiresRationale: true,
    requiresEvidenceTrace: false,
    auditBasis:
      'Steward rejects deliverable during review; rationale required for audit trail.',
  },
  // pending_review → draft (return for rework)
  {
    from: 'pending_review',
    to: 'draft',
    requiredRole: 'steward',
    requiresRationale: true,
    requiresEvidenceTrace: false,
    auditBasis:
      'Steward returns deliverable to draft for rework; rationale required.',
  },
  // approved → locked
  {
    from: 'approved',
    to: 'locked',
    requiredRole: 'client_sponsor',
    requiresRationale: true,
    requiresEvidenceTrace: true,
    auditBasis:
      'Client sponsor locks an approved deliverable; rationale and evidence trace required for governance record.',
  },
  // approved → superseded
  {
    from: 'approved',
    to: 'superseded',
    requiredRole: 'maestro',
    requiresRationale: true,
    requiresEvidenceTrace: true,
    auditBasis:
      'Maestro supersedes an approved deliverable (e.g. updated evidence or scope change); rationale and evidence trace required.',
  },
  // approved → rejected (post-approval revocation, e.g. corrected error)
  {
    from: 'approved',
    to: 'rejected',
    requiredRole: 'cxo_sponsor',
    requiresRationale: true,
    requiresEvidenceTrace: true,
    auditBasis:
      'CXO sponsor revokes approval; full rationale and evidence trace required for executive record.',
  },
  // rejected → draft (reinstate for revision)
  {
    from: 'rejected',
    to: 'draft',
    requiredRole: 'maestro',
    requiresRationale: true,
    requiresEvidenceTrace: false,
    auditBasis:
      'Maestro reinstates rejected deliverable as draft for revision; rationale required.',
  },
  // superseded → locked (archive-lock superseded version)
  {
    from: 'superseded',
    to: 'locked',
    requiredRole: 'steward',
    requiresRationale: true,
    requiresEvidenceTrace: false,
    auditBasis:
      'Steward archive-locks a superseded deliverable; rationale required.',
  },
  // locked → superseded (unlock only for strategic pivot; very restricted)
  {
    from: 'locked',
    to: 'superseded',
    requiredRole: 'cxo_sponsor',
    requiresRationale: true,
    requiresEvidenceTrace: true,
    auditBasis:
      'CXO sponsor unlocks and supersedes a locked deliverable (strategic pivot only); rationale and evidence trace required.',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Return all legal transitions from a given approval state.
 * All returned transitions carry isAllowed: true.
 * Pure: same fromState → identical output.
 */
export function getAllowedTransitions(
  fromState: ApprovalState,
): ApprovalTransition[] {
  return TRANSITION_TABLE.filter((t) => t.from === fromState).map((t) => ({
    ...t,
    isAllowed: true,
  }));
}

/**
 * Build the deterministic approval flow manifest for a canonical set
 * of sample deliverables in different approval states. Pure: same
 * invocation → identical output.
 *
 * proposedOnly is always typed as literal true — no real DB writes happen.
 */
export function buildDeliverableApprovalFlowManifest(): DeliverableApprovalFlowManifest {
  const deliverables = SAMPLE_DELIVERABLES;

  const approvedCount = deliverables.filter(
    (d) => d.currentState === 'approved',
  ).length;
  const pendingCount = deliverables.filter(
    (d) => d.currentState === 'pending_review',
  ).length;
  const lockedCount = deliverables.filter(
    (d) => d.currentState === 'locked',
  ).length;

  return {
    generatedAt: '2026-04-26',
    totalDeliverables: deliverables.length,
    approvedCount,
    pendingCount,
    lockedCount,
    proposedOnly: true,
    deliverables: [...deliverables],
  };
}

// ---------------------------------------------------------------------
// Sample deliverables (at least 4, covering different states)
// ---------------------------------------------------------------------

const SAMPLE_DELIVERABLES: ReadonlyArray<DeliverableApprovalRecord> = [
  // 1. Draft — AI Contact Center Business Case (Apex Retail)
  {
    deliverableId: 'apex-contact-center-ai-business-case',
    deliverableName: 'AI Contact Center Business Case',
    currentState: 'draft',
    allowedTransitions: getAllowedTransitions('draft'),
    blockers: ['missing_evidence', 'pending_review'],
    lockReason: null,
    supersedeReason: null,
    isDecisionGrade: false,
    requiresEvidenceTrace: false,
    proposedOnly: true,
    auditBasis:
      'Draft business case seeded from deterministic program plan; no steward review has occurred.',
  },
  // 2. Pending review — CDP Architecture Decision Record (Apex Retail)
  //    Decision-grade → requiresEvidenceTrace: true
  {
    deliverableId: 'apex-cdp-architecture-decision-record',
    deliverableName: 'CDP Architecture Decision Record',
    currentState: 'pending_review',
    allowedTransitions: getAllowedTransitions('pending_review'),
    blockers: ['unresolved_risk', 'needs_sponsor_signoff'],
    lockReason: null,
    supersedeReason: null,
    isDecisionGrade: true,
    requiresEvidenceTrace: true,
    proposedOnly: true,
    auditBasis:
      'Architecture decision record submitted for Steward review; evidence trace required before approval.',
  },
  // 3. Approved — Demand Forecasting Value Ledger (Apex Retail)
  //    Decision-grade → requiresEvidenceTrace: true
  {
    deliverableId: 'apex-demand-forecasting-value-ledger',
    deliverableName: 'Demand Forecasting Value Ledger',
    currentState: 'approved',
    allowedTransitions: getAllowedTransitions('approved'),
    blockers: [],
    lockReason: null,
    supersedeReason: null,
    isDecisionGrade: true,
    requiresEvidenceTrace: true,
    proposedOnly: true,
    auditBasis:
      'Value ledger approved by Steward after evidence-backed review; awaiting client sponsor lock.',
  },
  // 4. Locked — Store Associate Productivity Program Charter (Apex Retail)
  {
    deliverableId: 'apex-store-assoc-productivity-program-charter',
    deliverableName: 'Store Associate Productivity Program Charter',
    currentState: 'locked',
    allowedTransitions: getAllowedTransitions('locked'),
    blockers: [],
    lockReason: 'client_signed_off',
    supersedeReason: null,
    isDecisionGrade: false,
    requiresEvidenceTrace: false,
    proposedOnly: true,
    auditBasis:
      'Program charter locked following client sign-off; no further edits permitted without CXO unlock.',
  },
  // 5. Rejected — Meridian Intelligence Workshop Notes v1
  {
    deliverableId: 'meridian-intelligence-workshop-notes-v1',
    deliverableName: 'Intelligence Workshop Notes v1',
    currentState: 'rejected',
    allowedTransitions: getAllowedTransitions('rejected'),
    blockers: ['missing_evidence'],
    lockReason: null,
    supersedeReason: null,
    isDecisionGrade: false,
    requiresEvidenceTrace: false,
    proposedOnly: true,
    auditBasis:
      'Workshop notes rejected by Steward; insufficient evidence citations; returned to Maestro for revision.',
  },
  // 6. Superseded — Apex Retail Contact Center AI Steering Deck v1
  //    Decision-grade → requiresEvidenceTrace: true
  {
    deliverableId: 'apex-contact-center-ai-steering-deck-v1',
    deliverableName: 'Contact Center AI Steering Deck v1',
    currentState: 'superseded',
    allowedTransitions: getAllowedTransitions('superseded'),
    blockers: [],
    lockReason: null,
    supersedeReason: 'updated_evidence',
    isDecisionGrade: true,
    requiresEvidenceTrace: true,
    proposedOnly: true,
    auditBasis:
      'Steering deck superseded after updated evidence was incorporated into v2; v1 preserved for audit trail.',
  },
];

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const APPROVAL_STATES_IN_ORDER: ReadonlyArray<ApprovalState> = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'superseded',
  'locked',
];

export const LOCK_REASONS_IN_ORDER: ReadonlyArray<LockReason> = [
  'approved_final',
  'board_presented',
  'client_signed_off',
  'archived',
];

export const SUPERSEDE_REASONS_IN_ORDER: ReadonlyArray<SupersedeReason> = [
  'updated_evidence',
  'scope_change',
  'corrected_error',
  'strategic_pivot',
];

export const REVIEWER_ROLES_IN_ORDER: ReadonlyArray<ReviewerRole> = [
  'maestro',
  'steward',
  'client_sponsor',
  'cxo_sponsor',
  'external_reviewer',
];

export const APPROVAL_BLOCKERS_IN_ORDER: ReadonlyArray<ApprovalBlocker> = [
  'missing_evidence',
  'unresolved_risk',
  'pending_review',
  'locked_by_prior',
  'needs_sponsor_signoff',
];
