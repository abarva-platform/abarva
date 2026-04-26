// TRUST3 · Dataset Approval Workflow.
//
// Pure deterministic read model that defines how a dataset moves from
// `loaded` (TRUST1 ladder state) toward `agent-usable`,
// `evidence-usable`, and `decision-grade` use. Encodes the approval
// pipeline so clients can see — without any runtime enforcement —
// which roles must review which datasets, and how that approval
// translates into permitted purposes.
//
// This is a READ MODEL. No DB writes, no migrations, no live runtime,
// no audit ledger writes, no model calls, no tool dispatcher hook. The
// future Steward UI and runtime gateway will consume the workflow to
// surface and enforce approvals; this module only documents shape and
// rule semantics.
//
// Reuses `DatasetTrustLevel` from TRUST1 via a type-only import so
// the L4 sensitive raw data rule is named in the same vocabulary as
// the dataset trust catalog. Approval state, role, condition, and
// audit-basis vocabularies are TRUST3-local.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/nexus/**, src/lib/sentinel/**, src/lib/atlas/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import type { DatasetTrustLevel } from '@/lib/admin/dataset-trust-model';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Canonical approval workflow states. Ordered roughly from intake
 * through review through outcome:
 *
 *   requested                  — owner has filed an approval request
 *   owner_review               — data owner is reviewing
 *   security_review            — security review lead is reviewing
 *   governance_review          — governance review lead is reviewing
 *   approved_for_summary       — may be used for L2 / L1 / L0 summaries
 *   approved_for_evidence      — may be cited as evidence (manifest)
 *   approved_for_agent_use     — agent runtime may consume the dataset
 *   approved_for_deliverables  — deliverables may cite this dataset
 *   rejected                   — terminal: review failed
 *   revoked                    — terminal: prior approval withdrawn
 *   expired                    — terminal: approval window passed
 */
export type DatasetApprovalState =
  | 'requested'
  | 'owner_review'
  | 'security_review'
  | 'governance_review'
  | 'approved_for_summary'
  | 'approved_for_evidence'
  | 'approved_for_agent_use'
  | 'approved_for_deliverables'
  | 'rejected'
  | 'revoked'
  | 'expired';

/** Roles that may sign off on a dataset approval request. */
export type DatasetApprovalRole =
  | 'data_owner'
  | 'security_review_lead'
  | 'governance_review_lead'
  | 'tenant_admin'
  | 'abarva_steward';

/**
 * The canonical purposes an approval may unlock. These mirror the
 * shape of the agent data access policy purposes but are scoped to
 * what the approval workflow itself decides.
 */
export type DatasetApprovalPurpose =
  | 'summary_use'
  | 'evidence_use'
  | 'agent_use'
  | 'deliverable_use';

/**
 * Conditions that may attach to an approval. Conditions narrow the
 * scope of an approval without rejecting it outright.
 */
export type DatasetApprovalCondition =
  | 'redact_pii_before_use'
  | 'aggregate_only'
  | 'time_boxed_window'
  | 'named_purpose_only'
  | 'no_export_outside_tenant';

/**
 * Why a decision was made. Every decision returns at least one
 * audit-basis tag so reviewers can trace the rationale without
 * re-reading the full request.
 */
export type DatasetApprovalAuditBasis =
  | 'l4_requires_owner_and_governance'
  | 'agent_use_requires_explicit_agent_approval'
  | 'deliverable_use_requires_evidence_and_deliverable_approval'
  | 'revoked_blocks_all_use'
  | 'expired_blocks_all_use'
  | 'rejected_blocks_all_use'
  | 'state_does_not_grant_purpose'
  | 'review_pending'
  | 'state_grants_purpose';

/**
 * Reasons a decision returned `permitted: false`. A blocking decision
 * always lists at least one block reason and at least one audit basis.
 */
export type DatasetApprovalBlockReason =
  | 'state_revoked'
  | 'state_expired'
  | 'state_rejected'
  | 'review_in_progress'
  | 'l4_missing_owner_review'
  | 'l4_missing_governance_review'
  | 'agent_use_not_explicitly_approved'
  | 'deliverable_use_missing_evidence_approval'
  | 'deliverable_use_missing_deliverable_approval'
  | 'state_does_not_match_purpose';

/**
 * A single dataset approval request. Represents intake — what the
 * tenant is asking to use, at what trust level, for which purpose,
 * and which roles have already reviewed it.
 */
export interface DatasetApprovalRequest {
  /** Stable id, e.g. `dataset_approval:<datasetId>:<purpose>`. */
  requestId: string;
  /** The dataset under review. */
  datasetId: string;
  /** TRUST1 trust level (type-only import). */
  trustLevel: DatasetTrustLevel;
  /** The purpose this request is asking to unlock. */
  purpose: DatasetApprovalPurpose;
  /** Current state of the approval. */
  state: DatasetApprovalState;
  /** Roles that have signed off (positive review). */
  reviews: ReadonlyArray<DatasetApprovalRole>;
  /** Conditions attached to the approval (if any). */
  conditions: ReadonlyArray<DatasetApprovalCondition>;
}

/**
 * The outcome of evaluating a single approval request. Always carries
 * a `rationale` (single sentence) and at least one
 * `auditBasis` tag; populates `blockReasons` only when
 * `permitted === false`.
 */
export interface DatasetApprovalDecision {
  requestId: string;
  datasetId: string;
  trustLevel: DatasetTrustLevel;
  purpose: DatasetApprovalPurpose;
  state: DatasetApprovalState;
  permitted: boolean;
  rationale: string;
  auditBasis: ReadonlyArray<DatasetApprovalAuditBasis>;
  blockReasons: ReadonlyArray<DatasetApprovalBlockReason>;
  /** Conditions that propagate to the consumer. */
  conditions: ReadonlyArray<DatasetApprovalCondition>;
  createdFrom: 'deterministic_dataset_approval_workflow_seed';
}

/** A canonical state descriptor. */
export interface DatasetApprovalStateDescriptor {
  state: DatasetApprovalState;
  ordinal: number;
  label: string;
  description: string;
  /** True when this state is terminal (no further transitions). */
  terminal: boolean;
  /** True when this state grants any purpose at all. */
  grantsAny: boolean;
  /** Purposes this state grants by itself. */
  grantsPurposes: ReadonlyArray<DatasetApprovalPurpose>;
  /** True when this state blocks all use regardless of prior approval. */
  blocksAllUse: boolean;
}

/** A canonical role descriptor. */
export interface DatasetApprovalRoleDescriptor {
  role: DatasetApprovalRole;
  label: string;
  description: string;
}

/** Aggregated readiness summary across many decisions. */
export interface DatasetApprovalWorkflowSummary {
  total: number;
  permittedTotal: number;
  blockedTotal: number;
  byState: Record<DatasetApprovalState, number>;
  byPurpose: Record<DatasetApprovalPurpose, number>;
  /** Decisions blocked because the state is revoked / expired / rejected. */
  terminalBlockedTotal: number;
  /** Decisions blocked because review is still in progress. */
  reviewPendingTotal: number;
  /** Decisions blocked because L4 review chain is incomplete. */
  l4MissingReviewTotal: number;
}

/** Full deterministic workflow catalog. */
export interface DatasetApprovalWorkflow {
  generatedFrom: 'deterministic_dataset_approval_workflow_seed';
  states: ReadonlyArray<DatasetApprovalStateDescriptor>;
  roles: ReadonlyArray<DatasetApprovalRoleDescriptor>;
  rules: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

export const DATASET_APPROVAL_STATES_IN_ORDER: ReadonlyArray<DatasetApprovalState> = [
  'requested',
  'owner_review',
  'security_review',
  'governance_review',
  'approved_for_summary',
  'approved_for_evidence',
  'approved_for_agent_use',
  'approved_for_deliverables',
  'rejected',
  'revoked',
  'expired',
];

export const DATASET_APPROVAL_ROLES_IN_ORDER: ReadonlyArray<DatasetApprovalRole> = [
  'data_owner',
  'security_review_lead',
  'governance_review_lead',
  'tenant_admin',
  'abarva_steward',
];

export const DATASET_APPROVAL_PURPOSES_IN_ORDER: ReadonlyArray<DatasetApprovalPurpose> = [
  'summary_use',
  'evidence_use',
  'agent_use',
  'deliverable_use',
];

const TERMINAL_BLOCKING_STATES: ReadonlySet<DatasetApprovalState> = new Set<DatasetApprovalState>([
  'rejected',
  'revoked',
  'expired',
]);

const IN_REVIEW_STATES: ReadonlySet<DatasetApprovalState> = new Set<DatasetApprovalState>([
  'requested',
  'owner_review',
  'security_review',
  'governance_review',
]);

// ---------------------------------------------------------------------
// Canonical descriptors
// ---------------------------------------------------------------------

const STATE_DESCRIPTORS: ReadonlyArray<DatasetApprovalStateDescriptor> = [
  {
    state: 'requested',
    ordinal: 0,
    label: 'Requested',
    description:
      'Approval request has been filed; no role has reviewed it yet.',
    terminal: false,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: false,
  },
  {
    state: 'owner_review',
    ordinal: 1,
    label: 'Data owner review',
    description:
      'The data owner is reviewing the request; no purpose is unlocked yet.',
    terminal: false,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: false,
  },
  {
    state: 'security_review',
    ordinal: 2,
    label: 'Security review',
    description:
      'The security review lead is reviewing the request; no purpose is unlocked yet.',
    terminal: false,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: false,
  },
  {
    state: 'governance_review',
    ordinal: 3,
    label: 'Governance review',
    description:
      'The governance review lead is reviewing the request; no purpose is unlocked yet.',
    terminal: false,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: false,
  },
  {
    state: 'approved_for_summary',
    ordinal: 4,
    label: 'Approved for summary',
    description:
      'Approved for summary / aggregate consumption only; does not unlock evidence, agent, or deliverable use.',
    terminal: false,
    grantsAny: true,
    grantsPurposes: ['summary_use'],
    blocksAllUse: false,
  },
  {
    state: 'approved_for_evidence',
    ordinal: 5,
    label: 'Approved for evidence',
    description:
      'Approved for citation as evidence via manifest; does not by itself unlock agent runtime use or deliverable inclusion.',
    terminal: false,
    grantsAny: true,
    grantsPurposes: ['summary_use', 'evidence_use'],
    blocksAllUse: false,
  },
  {
    state: 'approved_for_agent_use',
    ordinal: 6,
    label: 'Approved for agent use',
    description:
      'Approved for agent runtime consumption. Agent use requires explicit approval at this level; it is not derivable from approved_for_summary.',
    terminal: false,
    grantsAny: true,
    grantsPurposes: ['summary_use', 'evidence_use', 'agent_use'],
    blocksAllUse: false,
  },
  {
    state: 'approved_for_deliverables',
    ordinal: 7,
    label: 'Approved for deliverables',
    description:
      'Approved for inclusion in client-facing deliverables. Deliverable use additionally requires the dataset to also be approved_for_evidence.',
    terminal: false,
    grantsAny: true,
    grantsPurposes: ['summary_use', 'evidence_use', 'agent_use', 'deliverable_use'],
    blocksAllUse: false,
  },
  {
    state: 'rejected',
    ordinal: 8,
    label: 'Rejected',
    description:
      'Terminal: review failed. The dataset cannot be used for any approval-gated purpose until a fresh request is filed.',
    terminal: true,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: true,
  },
  {
    state: 'revoked',
    ordinal: 9,
    label: 'Revoked',
    description:
      'Terminal: a prior approval has been withdrawn. Blocks ALL use across every purpose regardless of prior state.',
    terminal: true,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: true,
  },
  {
    state: 'expired',
    ordinal: 10,
    label: 'Expired',
    description:
      'Terminal: the approval window has lapsed. Blocks ALL use across every purpose regardless of prior state.',
    terminal: true,
    grantsAny: false,
    grantsPurposes: [],
    blocksAllUse: true,
  },
];

const ROLE_DESCRIPTORS: ReadonlyArray<DatasetApprovalRoleDescriptor> = [
  {
    role: 'data_owner',
    label: 'Data owner',
    description:
      'The accountable owner of the dataset on the tenant side. Required reviewer for L4 sensitive raw data.',
  },
  {
    role: 'security_review_lead',
    label: 'Security review lead',
    description:
      'Tenant-side security reviewer responsible for confirming controls before the approval advances.',
  },
  {
    role: 'governance_review_lead',
    label: 'Governance review lead',
    description:
      'Tenant-side governance reviewer responsible for confirming policy fit. Required reviewer for L4 sensitive raw data.',
  },
  {
    role: 'tenant_admin',
    label: 'Tenant admin',
    description:
      'Operational admin who routes requests through the workflow.',
  },
  {
    role: 'abarva_steward',
    label: 'AbarVa Steward',
    description:
      'AbarVa-side steward who records the approval and ensures it never advances without the right tenant-side reviewers.',
  },
];

const WORKFLOW_RULES: ReadonlyArray<string> = [
  'agent use requires explicit approved_for_agent_use; it is not derivable from approved_for_summary.',
  'deliverable use requires both approved_for_deliverables AND approved_for_evidence.',
  'L4 sensitive raw data requires reviews from BOTH data_owner AND governance_review_lead before any approval advances.',
  'revoked, expired, or rejected state blocks ALL use regardless of prior approval.',
  'every decision returns a rationale and at least one audit basis tag.',
  'review-in-progress states (requested / owner_review / security_review / governance_review) grant no purpose.',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic dataset approval workflow catalog. Pure:
 * same call → identical output.
 */
export function buildDatasetApprovalWorkflow(): DatasetApprovalWorkflow {
  return {
    generatedFrom: 'deterministic_dataset_approval_workflow_seed',
    states: STATE_DESCRIPTORS,
    roles: ROLE_DESCRIPTORS,
    rules: WORKFLOW_RULES,
  };
}

/**
 * Evaluate a single approval request. Returns a permitted/blocked
 * decision with a rationale, an audit-basis trail, and any
 * conditions that propagate from the request. Pure: same input →
 * identical output.
 */
export function evaluateDatasetApprovalRequest(
  request: DatasetApprovalRequest,
): DatasetApprovalDecision {
  const auditBasis: DatasetApprovalAuditBasis[] = [];
  const blockReasons: DatasetApprovalBlockReason[] = [];

  // Rule: terminal blocking states block ALL use across every purpose.
  if (request.state === 'revoked') {
    auditBasis.push('revoked_blocks_all_use');
    blockReasons.push('state_revoked');
  } else if (request.state === 'expired') {
    auditBasis.push('expired_blocks_all_use');
    blockReasons.push('state_expired');
  } else if (request.state === 'rejected') {
    auditBasis.push('rejected_blocks_all_use');
    blockReasons.push('state_rejected');
  }

  // Rule: review-in-progress states grant no purpose.
  if (IN_REVIEW_STATES.has(request.state)) {
    auditBasis.push('review_pending');
    blockReasons.push('review_in_progress');
  }

  // Rule: L4 sensitive raw data requires data_owner AND
  // governance_review_lead reviews. We emit the audit-basis tag for
  // every L4 request regardless of state, and add block reasons when
  // either reviewer is missing.
  const reviewSet = new Set<DatasetApprovalRole>(request.reviews);
  if (request.trustLevel === 'L4_sensitive_raw_data') {
    auditBasis.push('l4_requires_owner_and_governance');
    if (!reviewSet.has('data_owner')) {
      blockReasons.push('l4_missing_owner_review');
    }
    if (!reviewSet.has('governance_review_lead')) {
      blockReasons.push('l4_missing_governance_review');
    }
  }

  // Rule: agent use requires explicit approved_for_agent_use.
  // approved_for_summary does NOT confer agent use. Note that
  // approved_for_deliverables implies agent_use is unlocked (since
  // deliverable approval is the most permissive non-terminal state).
  if (request.purpose === 'agent_use') {
    auditBasis.push('agent_use_requires_explicit_agent_approval');
    if (
      request.state !== 'approved_for_agent_use' &&
      request.state !== 'approved_for_deliverables'
    ) {
      blockReasons.push('agent_use_not_explicitly_approved');
    }
  }

  // Rule: deliverable use requires approved_for_deliverables AND
  // approved_for_evidence. Because state is a single value, we encode
  // this as: state must be approved_for_deliverables (which logically
  // implies the evidence approval has also been recorded). We also
  // require the request reviews to indicate a governance reviewer has
  // signed off on the evidence side; the audit-basis tag names both
  // requirements regardless.
  if (request.purpose === 'deliverable_use') {
    auditBasis.push('deliverable_use_requires_evidence_and_deliverable_approval');
    if (request.state !== 'approved_for_deliverables') {
      blockReasons.push('deliverable_use_missing_deliverable_approval');
    }
    // Without an evidence approval recorded somewhere in the chain,
    // we cannot grant deliverable use. The chain is recorded via
    // reviews: a governance reviewer signs off on evidence-grade use.
    if (!reviewSet.has('governance_review_lead')) {
      blockReasons.push('deliverable_use_missing_evidence_approval');
    }
  }

  // Rule: state must grant the requested purpose (when not blocked
  // for terminal / review-in-progress / L4 reasons already).
  const stateDescriptor = STATE_DESCRIPTORS.find(
    (d) => d.state === request.state,
  );
  const grantsPurposes = stateDescriptor
    ? stateDescriptor.grantsPurposes
    : [];
  const stateGrantsPurpose = grantsPurposes.includes(request.purpose);
  if (!stateGrantsPurpose && !TERMINAL_BLOCKING_STATES.has(request.state) && !IN_REVIEW_STATES.has(request.state)) {
    auditBasis.push('state_does_not_grant_purpose');
    blockReasons.push('state_does_not_match_purpose');
  }

  // If we have a clean grant, tag it and emit no block reasons.
  if (blockReasons.length === 0 && stateGrantsPurpose) {
    auditBasis.push('state_grants_purpose');
  }

  const permitted = blockReasons.length === 0;
  const rationale = buildRationale(request, permitted, blockReasons);

  // Defensive: every decision must carry at least one audit basis.
  if (auditBasis.length === 0) {
    auditBasis.push('state_does_not_grant_purpose');
  }

  return {
    requestId: request.requestId,
    datasetId: request.datasetId,
    trustLevel: request.trustLevel,
    purpose: request.purpose,
    state: request.state,
    permitted,
    rationale,
    auditBasis,
    blockReasons,
    conditions: request.conditions,
    createdFrom: 'deterministic_dataset_approval_workflow_seed',
  };
}

/**
 * Aggregate a list of approval decisions. Pure.
 */
export function summarizeDatasetApprovals(
  decisions: ReadonlyArray<DatasetApprovalDecision>,
): DatasetApprovalWorkflowSummary {
  const byState = emptyByState();
  const byPurpose = emptyByPurpose();
  let permittedTotal = 0;
  let blockedTotal = 0;
  let terminalBlockedTotal = 0;
  let reviewPendingTotal = 0;
  let l4MissingReviewTotal = 0;
  for (const d of decisions) {
    byState[d.state] += 1;
    byPurpose[d.purpose] += 1;
    if (d.permitted) {
      permittedTotal += 1;
    } else {
      blockedTotal += 1;
      if (
        d.blockReasons.includes('state_revoked') ||
        d.blockReasons.includes('state_expired') ||
        d.blockReasons.includes('state_rejected')
      ) {
        terminalBlockedTotal += 1;
      }
      if (d.blockReasons.includes('review_in_progress')) {
        reviewPendingTotal += 1;
      }
      if (
        d.blockReasons.includes('l4_missing_owner_review') ||
        d.blockReasons.includes('l4_missing_governance_review')
      ) {
        l4MissingReviewTotal += 1;
      }
    }
  }
  return {
    total: decisions.length,
    permittedTotal,
    blockedTotal,
    byState,
    byPurpose,
    terminalBlockedTotal,
    reviewPendingTotal,
    l4MissingReviewTotal,
  };
}

/**
 * Return decisions whose state is `revoked` or `expired`. Useful for
 * surfacing datasets that have lost prior approval. Pure.
 */
export function getRevokedOrExpiredDatasets(
  decisions: ReadonlyArray<DatasetApprovalDecision>,
): ReadonlyArray<DatasetApprovalDecision> {
  return decisions.filter(
    (d) => d.state === 'revoked' || d.state === 'expired',
  );
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildRationale(
  request: DatasetApprovalRequest,
  permitted: boolean,
  blockReasons: ReadonlyArray<DatasetApprovalBlockReason>,
): string {
  if (permitted) {
    return `Approved: ${request.state} grants ${request.purpose} for ${request.trustLevel} on ${request.datasetId}.`;
  }
  if (blockReasons.includes('state_revoked')) {
    return `Blocked: prior approval has been revoked for ${request.datasetId}; no purpose is permitted until a fresh approval is recorded.`;
  }
  if (blockReasons.includes('state_expired')) {
    return `Blocked: approval window has expired for ${request.datasetId}; no purpose is permitted until a fresh approval is recorded.`;
  }
  if (blockReasons.includes('state_rejected')) {
    return `Blocked: approval was rejected for ${request.datasetId}; no purpose is permitted until a fresh request is filed.`;
  }
  if (blockReasons.includes('review_in_progress')) {
    return `Blocked: ${request.state} is a review-in-progress state; no purpose is granted until review completes.`;
  }
  if (
    blockReasons.includes('l4_missing_owner_review') ||
    blockReasons.includes('l4_missing_governance_review')
  ) {
    return `Blocked: L4 sensitive raw data requires reviews from both data_owner and governance_review_lead before any approval advances.`;
  }
  if (blockReasons.includes('agent_use_not_explicitly_approved')) {
    return `Blocked: agent use requires explicit approved_for_agent_use; the current state ${request.state} does not confer agent runtime consumption.`;
  }
  if (
    blockReasons.includes('deliverable_use_missing_deliverable_approval') ||
    blockReasons.includes('deliverable_use_missing_evidence_approval')
  ) {
    return `Blocked: deliverable use requires both approved_for_deliverables AND approved_for_evidence (via governance review).`;
  }
  if (blockReasons.includes('state_does_not_match_purpose')) {
    return `Blocked: state ${request.state} does not grant ${request.purpose} on ${request.datasetId}.`;
  }
  return `Blocked: approval workflow rules prevent ${request.purpose} on ${request.datasetId} at state ${request.state}.`;
}

function emptyByState(): Record<DatasetApprovalState, number> {
  return {
    requested: 0,
    owner_review: 0,
    security_review: 0,
    governance_review: 0,
    approved_for_summary: 0,
    approved_for_evidence: 0,
    approved_for_agent_use: 0,
    approved_for_deliverables: 0,
    rejected: 0,
    revoked: 0,
    expired: 0,
  };
}

function emptyByPurpose(): Record<DatasetApprovalPurpose, number> {
  return {
    summary_use: 0,
    evidence_use: 0,
    agent_use: 0,
    deliverable_use: 0,
  };
}
