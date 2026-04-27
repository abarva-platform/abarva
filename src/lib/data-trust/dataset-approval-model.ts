// DATA2 · Dataset Approval Model.
//
// Pure deterministic read model that defines the approval lifecycle for
// datasets in AbarVa. This module encodes the state machine that governs
// how a dataset moves from "unapproved" through "approval requested" to
// "approved for specific purposes" or "rejected/revoked/expired".
//
// TRUST3 (dataset-approval-workflow.ts) defines the workflow types and
// approval states. This module defines the approval model lifecycle:
//   - named approvers per approval level
//   - approval scope (which purposes are permitted by each approval)
//   - expiry policy (approvals are time-bounded)
//   - revocation rules (approvals can be revoked without a new approval)
//   - honest state: no fabricated approvals; absence = denied
//
// Key invariants:
//   - approved_state === approved → at least one named approver recorded
//   - expiry date is always bounded (no perpetual approvals)
//   - revocation is terminal unless a new approval is filed
//   - every approval scope maps to a set of permitted DataSharingRequestActions
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no audit ledger writes, no Steward runtime.
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
import type { DataSharingRequestAction } from '@/lib/data-trust/data-sharing-enforcement';

// ---------------------------------------------------------------------
// Approval model types
// ---------------------------------------------------------------------

/**
 * Canonical approval lifecycle states for a dataset.
 *
 * - not_requested          → no approval has been filed
 * - requested              → approval request filed, not yet reviewed
 * - under_review           → at least one approver has started reviewing
 * - approved               → all required approvers have approved
 * - partially_approved     → approved for a subset of requested purposes
 * - rejected               → terminal: approval request was denied
 * - revoked                → terminal: prior approval was withdrawn
 * - expired                → terminal: approval window has passed
 */
export type DatasetApprovalLifecycleState =
  | 'not_requested'
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'revoked'
  | 'expired';

/**
 * Approval scope — defines what the approval permits.
 *
 * - summary_only           → permits L1/L2 summary reads only
 * - evidence_manifest      → permits evidence manifest citations
 * - agent_context          → permits agent runtime context build
 * - decision_artifact      → permits citation in decision deliverables
 * - raw_records            → permits raw record reads (L4 only; must be named)
 */
export type DatasetApprovalScope =
  | 'summary_only'
  | 'evidence_manifest'
  | 'agent_context'
  | 'decision_artifact'
  | 'raw_records';

/**
 * Approver role class. Defines who must approve for each scope tier.
 */
export type DatasetApproverRole =
  | 'data_owner'
  | 'security_lead'
  | 'governance_lead'
  | 'executive_sponsor';

/**
 * A single named approver entry. Must include a named role; fabricated
 * approver entries are structurally invalid.
 */
export interface DatasetApproverEntry {
  /** Named approver role, e.g. "VP of Customer Care". */
  approverRole: string;
  /** Role class for approval tier matching. */
  roleClass: DatasetApproverRole;
  /** ISO YYYY-MM-DD when the approver signed. */
  approvedAt: string;
  /**
   * Structural marker — every real approver entry carries this.
   * Used by the validator to reject fabricated approval stamps.
   */
  approvalIsNamed: true;
}

/**
 * Full approval record for a dataset. The `lifecycleState` is the
 * authoritative state; `permittedScopes` is only meaningful when
 * `lifecycleState` is 'approved' or 'partially_approved'.
 */
export interface DatasetApprovalRecord {
  /** Stable dataset id. */
  datasetId: string;
  /** Sharing level of the dataset at the time of this approval. */
  sharingLevel: DatasetTrustLevel;
  /** Current lifecycle state. */
  lifecycleState: DatasetApprovalLifecycleState;
  /** Named approvers recorded on this record. */
  approvers: ReadonlyArray<DatasetApproverEntry>;
  /** Scopes this approval covers. Empty when not approved. */
  permittedScopes: ReadonlyArray<DatasetApprovalScope>;
  /** ISO YYYY-MM-DD when this approval record was created. */
  createdAt: string;
  /** ISO YYYY-MM-DD when this approval expires. Approval is bounded. */
  expiresAt: string;
  /**
   * Reason for rejection or revocation. Required when `lifecycleState`
   * is 'rejected' or 'revoked'.
   */
  terminalReason?: string;
  createdFrom: 'deterministic_dataset_approval_model_seed';
}

/** Outcome of validating a single approval record. */
export interface DatasetApprovalValidation {
  valid: boolean;
  reasons: ReadonlyArray<string>;
}

/**
 * Result of evaluating whether a specific action is permitted given
 * an approval record.
 */
export interface DatasetApprovalGateDecision {
  permitted: boolean;
  datasetId: string;
  action: DataSharingRequestAction;
  lifecycleState: DatasetApprovalLifecycleState;
  reasons: ReadonlyArray<string>;
  /** Single-sentence guidance for the requesting agent or Steward. */
  guidance: string;
  createdFrom: 'deterministic_dataset_approval_model_seed';
}

/** Aggregated summary over many approval records. */
export interface DatasetApprovalModelSummary {
  total: number;
  byLifecycleState: Record<DatasetApprovalLifecycleState, number>;
  byApprovalScope: Record<DatasetApprovalScope, number>;
  terminalRecordCount: number;
  namedApproverTotal: number;
  expiringWithin90DaysCount: number;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

const ALL_LIFECYCLE_STATES: ReadonlyArray<DatasetApprovalLifecycleState> = [
  'not_requested',
  'requested',
  'under_review',
  'approved',
  'partially_approved',
  'rejected',
  'revoked',
  'expired',
];

const ALL_APPROVAL_SCOPES: ReadonlyArray<DatasetApprovalScope> = [
  'summary_only',
  'evidence_manifest',
  'agent_context',
  'decision_artifact',
  'raw_records',
];

const TERMINAL_STATES: ReadonlySet<DatasetApprovalLifecycleState> = new Set([
  'rejected',
  'revoked',
  'expired',
]);

/**
 * Maps each approval scope to the set of DataSharingRequestActions it
 * permits. An action is permitted if ANY of the record's permitted scopes
 * covers it.
 */
const SCOPE_PERMITTED_ACTIONS: Record<
  DatasetApprovalScope,
  ReadonlyArray<DataSharingRequestAction>
> = {
  summary_only: ['read_metadata', 'read_aggregate'],
  evidence_manifest: ['read_metadata', 'read_aggregate', 'evidence_citation'],
  agent_context: [
    'read_metadata',
    'read_aggregate',
    'read_redacted_extract',
    'evidence_citation',
    'agent_context_build',
  ],
  decision_artifact: [
    'read_metadata',
    'read_aggregate',
    'read_redacted_extract',
    'evidence_citation',
    'agent_context_build',
    'decision_artifact_cite',
  ],
  raw_records: [
    'read_metadata',
    'read_aggregate',
    'read_redacted_extract',
    'read_raw_records',
    'evidence_citation',
    'agent_context_build',
    'decision_artifact_cite',
  ],
};

// ---------------------------------------------------------------------
// Required approver roles per scope
// ---------------------------------------------------------------------

const SCOPE_REQUIRED_ROLES: Record<
  DatasetApprovalScope,
  ReadonlyArray<DatasetApproverRole>
> = {
  summary_only: ['data_owner'],
  evidence_manifest: ['data_owner'],
  agent_context: ['data_owner', 'security_lead'],
  decision_artifact: ['data_owner', 'governance_lead'],
  raw_records: ['data_owner', 'security_lead', 'executive_sponsor'],
};

// ---------------------------------------------------------------------
// Deterministic seed approval records
// ---------------------------------------------------------------------

const SEED_RECORDS: ReadonlyArray<DatasetApprovalRecord> = [
  {
    datasetId: 'ds-apex-kpi-summary',
    sharingLevel: 'L2_summary_aggregate',
    lifecycleState: 'approved',
    approvers: [
      {
        approverRole: 'VP of Customer Care',
        roleClass: 'data_owner',
        approvedAt: '2026-01-15',
        approvalIsNamed: true,
      },
      {
        approverRole: 'Head of Governance',
        roleClass: 'governance_lead',
        approvedAt: '2026-01-17',
        approvalIsNamed: true,
      },
    ],
    permittedScopes: ['summary_only', 'evidence_manifest', 'decision_artifact'],
    createdAt: '2026-01-10',
    expiresAt: '2026-07-10',
    createdFrom: 'deterministic_dataset_approval_model_seed',
  },
  {
    datasetId: 'ds-apex-agent-performance',
    sharingLevel: 'L3_redacted_extract',
    lifecycleState: 'approved',
    approvers: [
      {
        approverRole: 'Director of Contact Center Operations',
        roleClass: 'data_owner',
        approvedAt: '2026-02-01',
        approvalIsNamed: true,
      },
      {
        approverRole: 'CISO',
        roleClass: 'security_lead',
        approvedAt: '2026-02-03',
        approvalIsNamed: true,
      },
    ],
    permittedScopes: ['summary_only', 'evidence_manifest', 'agent_context'],
    createdAt: '2026-01-28',
    expiresAt: '2026-07-28',
    createdFrom: 'deterministic_dataset_approval_model_seed',
  },
  {
    datasetId: 'ds-apex-raw-employee-records',
    sharingLevel: 'L4_sensitive_raw_data',
    lifecycleState: 'not_requested',
    approvers: [],
    permittedScopes: [],
    createdAt: '2026-01-01',
    expiresAt: '2026-01-01',
    createdFrom: 'deterministic_dataset_approval_model_seed',
  },
  {
    datasetId: 'ds-apex-contact-volume-q1',
    sharingLevel: 'L2_summary_aggregate',
    lifecycleState: 'approved',
    approvers: [
      {
        approverRole: 'VP of Customer Care',
        roleClass: 'data_owner',
        approvedAt: '2026-01-15',
        approvalIsNamed: true,
      },
    ],
    permittedScopes: ['summary_only', 'evidence_manifest'],
    createdAt: '2026-01-10',
    expiresAt: '2026-07-10',
    createdFrom: 'deterministic_dataset_approval_model_seed',
  },
  {
    datasetId: 'ds-apex-schema-catalog',
    sharingLevel: 'L1_metadata_only',
    lifecycleState: 'approved',
    approvers: [
      {
        approverRole: 'Data Platform Lead',
        roleClass: 'data_owner',
        approvedAt: '2026-01-05',
        approvalIsNamed: true,
      },
    ],
    permittedScopes: ['summary_only', 'evidence_manifest'],
    createdAt: '2026-01-01',
    expiresAt: '2026-12-31',
    createdFrom: 'deterministic_dataset_approval_model_seed',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic approval model seed. Pure.
 */
export function buildDatasetApprovalModelSeed(): ReadonlyArray<DatasetApprovalRecord> {
  return SEED_RECORDS;
}

/**
 * Validate a single approval record against the model invariants. Pure.
 */
export function validateDatasetApprovalRecord(
  record: DatasetApprovalRecord,
): DatasetApprovalValidation {
  const reasons: string[] = [];

  if (!record.datasetId || record.datasetId.trim().length === 0) {
    reasons.push('dataset_id_missing');
  }

  if (!ALL_LIFECYCLE_STATES.includes(record.lifecycleState)) {
    reasons.push('lifecycle_state_invalid');
  }

  // Approved states must have at least one named approver.
  if (
    (record.lifecycleState === 'approved' ||
      record.lifecycleState === 'partially_approved') &&
    record.approvers.length === 0
  ) {
    reasons.push('approved_record_requires_at_least_one_named_approver');
  }

  // Every approver must be named.
  for (const approver of record.approvers) {
    if (!approver.approvalIsNamed) {
      reasons.push('approver_entry_not_named');
      break;
    }
    if (!approver.approverRole || approver.approverRole.trim().length === 0) {
      reasons.push('approver_role_missing');
      break;
    }
    if (!isIsoDate(approver.approvedAt)) {
      reasons.push('approver_approved_at_not_iso_date');
      break;
    }
  }

  // Terminal states require a terminalReason.
  if (
    TERMINAL_STATES.has(record.lifecycleState) &&
    record.lifecycleState !== 'expired' &&
    (!record.terminalReason || record.terminalReason.trim().length === 0)
  ) {
    reasons.push('terminal_record_requires_reason');
  }

  // Non-approved records should have empty permittedScopes.
  if (
    record.lifecycleState === 'not_requested' ||
    record.lifecycleState === 'requested' ||
    record.lifecycleState === 'under_review' ||
    TERMINAL_STATES.has(record.lifecycleState)
  ) {
    if (record.permittedScopes.length > 0) {
      reasons.push('non_approved_record_must_not_have_permitted_scopes');
    }
  }

  // Expiry must be a valid ISO date.
  if (!isIsoDate(record.expiresAt)) {
    reasons.push('expiry_date_not_iso_date');
  }

  // createdFrom marker must be correct.
  if (record.createdFrom !== 'deterministic_dataset_approval_model_seed') {
    reasons.push('created_from_marker_invalid');
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Evaluate whether a specific action is permitted given an approval record.
 * Pure. Does not read the clock — caller supplies the evaluationDate.
 *
 * @param record - The approval record for the dataset.
 * @param action - The action being requested.
 * @param evaluationDate - ISO YYYY-MM-DD date to evaluate expiry against.
 */
export function evaluateApprovalGate(
  record: DatasetApprovalRecord,
  action: DataSharingRequestAction,
  evaluationDate: string,
): DatasetApprovalGateDecision {
  const reasons: string[] = [];

  // Terminal state: always block.
  if (TERMINAL_STATES.has(record.lifecycleState)) {
    reasons.push(`approval_in_terminal_state_${record.lifecycleState}`);
  }

  // Not approved: block all non-trivial actions.
  if (
    record.lifecycleState === 'not_requested' ||
    record.lifecycleState === 'requested' ||
    record.lifecycleState === 'under_review'
  ) {
    if (action !== 'read_metadata') {
      reasons.push('approval_not_yet_granted');
    }
  }

  // Expiry check.
  if (
    isIsoDate(record.expiresAt) &&
    isIsoDate(evaluationDate) &&
    evaluationDate > record.expiresAt
  ) {
    reasons.push('approval_record_expired');
  }

  // Scope check — is the action covered by any permitted scope?
  if (
    (record.lifecycleState === 'approved' ||
      record.lifecycleState === 'partially_approved') &&
    reasons.length === 0
  ) {
    const isCovered = record.permittedScopes.some((scope) =>
      SCOPE_PERMITTED_ACTIONS[scope]?.includes(action),
    );
    if (!isCovered) {
      reasons.push('action_not_covered_by_permitted_scopes');
    }
  }

  const permitted = reasons.length === 0;
  const guidance = buildApprovalGuidance(record, action, permitted, reasons);

  return {
    permitted,
    datasetId: record.datasetId,
    action,
    lifecycleState: record.lifecycleState,
    reasons,
    guidance,
    createdFrom: 'deterministic_dataset_approval_model_seed',
  };
}

/**
 * Summarize a collection of approval records. Pure.
 */
export function summarizeDatasetApprovalModel(
  records: ReadonlyArray<DatasetApprovalRecord>,
  evaluationDate: string,
): DatasetApprovalModelSummary {
  const byLifecycleState = emptyByLifecycleState();
  const byApprovalScope = emptyByApprovalScope();
  let terminalRecordCount = 0;
  let namedApproverTotal = 0;
  let expiringWithin90DaysCount = 0;

  for (const record of records) {
    byLifecycleState[record.lifecycleState] += 1;
    for (const scope of record.permittedScopes) {
      byApprovalScope[scope] += 1;
    }
    if (TERMINAL_STATES.has(record.lifecycleState)) {
      terminalRecordCount += 1;
    }
    namedApproverTotal += record.approvers.filter(
      (a) => a.approvalIsNamed,
    ).length;
    // Check expiring within 90 days of evaluationDate.
    if (
      isIsoDate(record.expiresAt) &&
      isIsoDate(evaluationDate) &&
      record.lifecycleState === 'approved' &&
      record.expiresAt > evaluationDate
    ) {
      const evalDays = dateToRoughDays(evaluationDate);
      const expiryDays = dateToRoughDays(record.expiresAt);
      if (expiryDays - evalDays <= 90) {
        expiringWithin90DaysCount += 1;
      }
    }
  }

  return {
    total: records.length,
    byLifecycleState,
    byApprovalScope,
    terminalRecordCount,
    namedApproverTotal,
    expiringWithin90DaysCount,
  };
}

/**
 * List the required approver roles for a given scope.
 * Pure.
 */
export function getRequiredApproverRoles(
  scope: DatasetApprovalScope,
): ReadonlyArray<DatasetApproverRole> {
  return SCOPE_REQUIRED_ROLES[scope] ?? [];
}

/**
 * List the permitted actions for a given scope.
 * Pure.
 */
export function getPermittedActionsForScope(
  scope: DatasetApprovalScope,
): ReadonlyArray<DataSharingRequestAction> {
  return SCOPE_PERMITTED_ACTIONS[scope] ?? [];
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER: ReadonlyArray<DatasetApprovalLifecycleState> =
  ALL_LIFECYCLE_STATES;

export const DATASET_APPROVAL_SCOPES_IN_ORDER: ReadonlyArray<DatasetApprovalScope> =
  ALL_APPROVAL_SCOPES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildApprovalGuidance(
  record: DatasetApprovalRecord,
  action: DataSharingRequestAction,
  permitted: boolean,
  reasons: ReadonlyArray<string>,
): string {
  if (permitted) {
    if (action === 'read_raw_records') {
      return 'Raw read permitted under approval record; verify expiry date before each read cycle.';
    }
    if (action === 'agent_context_build') {
      return 'Agent context build permitted; monitor against the recorded approval scope.';
    }
    return 'Action is within the approved scope; proceed.';
  }
  if (reasons.some((r) => r.startsWith('approval_in_terminal_state'))) {
    return 'Approval is in a terminal state; file a new approval request to re-enable.';
  }
  if (reasons.includes('approval_record_expired')) {
    return 'Approval record has expired; renew the approval before re-evaluating.';
  }
  if (reasons.includes('approval_not_yet_granted')) {
    return 'Approval has not yet been granted; complete the review process before this action is permitted.';
  }
  if (reasons.includes('action_not_covered_by_permitted_scopes')) {
    return 'Action is not covered by the current permitted scopes; request an expanded approval scope.';
  }
  return 'Blocked by approval model rules; resolve the listed reasons before re-evaluating.';
}

function isIsoDate(s: string): boolean {
  if (typeof s !== 'string') return false;
  if (s.length !== 10) return false;
  if (s[4] !== '-' || s[7] !== '-') return false;
  for (let i = 0; i < s.length; i++) {
    if (i === 4 || i === 7) continue;
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
}

/**
 * Rough day count for ISO date comparison (not calendar-precise — used
 * only for the "expiring within 90 days" heuristic in the summary).
 * Pure.
 */
function dateToRoughDays(isoDate: string): number {
  const year = parseInt(isoDate.slice(0, 4), 10);
  const month = parseInt(isoDate.slice(5, 7), 10);
  const day = parseInt(isoDate.slice(8, 10), 10);
  return year * 365 + month * 30 + day;
}

function emptyByLifecycleState(): Record<
  DatasetApprovalLifecycleState,
  number
> {
  return {
    not_requested: 0,
    requested: 0,
    under_review: 0,
    approved: 0,
    partially_approved: 0,
    rejected: 0,
    revoked: 0,
    expired: 0,
  };
}

function emptyByApprovalScope(): Record<DatasetApprovalScope, number> {
  return {
    summary_only: 0,
    evidence_manifest: 0,
    agent_context: 0,
    decision_artifact: 0,
    raw_records: 0,
  };
}
