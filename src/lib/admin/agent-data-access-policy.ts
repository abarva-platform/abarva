// TRUST2 · Agent Data Access Policy Matrix.
//
// Pure deterministic policy matrix that defines which agents
// (Nexus / Sentinel / Atlas / Steward) may use which dataset trust /
// sharing levels for which canonical purposes.
//
// This is a READ MODEL. No live enforcement, no runtime hook, no
// audit ledger write, no model invocation. The Steward / Tower
// surfaces consume this matrix to surface the policy honestly; the
// future runtime tool dispatcher and model gateway are responsible
// for actual enforcement.
//
// LANE ISOLATION NOTE: TRUST1 (parallel build pack) defines
// `DatasetTrustLevel` and `DatasetTrustLadderState` in
// `src/lib/admin/dataset-trust-model.ts`. That module does NOT exist
// on this branch; the integration agent reconciles the duplicate
// type declarations during cherry-pick. We intentionally redeclare
// the sharing-level union locally as `AgentDatasetSharingLevel` to
// keep this lane self-contained.
//
// This module does NOT import:
//   - src/lib/admin/dataset-trust-model.ts (lane-isolated TRUST1)
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/nexus/**, src/lib/sentinel/**, src/lib/atlas/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/** The four canonical AbarVa agents that consume tenant data. */
export type AgentDataAccessAgent =
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'steward';

/**
 * The canonical purposes an agent might want to use a dataset for.
 * Each purpose has a different acceptable trust profile (e.g.,
 * cite_as_evidence requires a usable evidence trust state;
 * produce_executive_brief prefers L2_summary_aggregate).
 */
export type AgentDataUsePurpose =
  | 'summarize'
  | 'recommend'
  | 'cite_as_evidence'
  | 'generate_deliverable'
  | 'evaluate_governance'
  | 'create_mission'
  | 'produce_executive_brief';

/**
 * Local sharing-level union mirroring TRUST1's `DatasetTrustLevel`.
 * Reconciled during cherry-pick — this lane intentionally avoids
 * importing from `src/lib/admin/dataset-trust-model.ts`.
 *
 * Levels are ordered from most-shareable to most-sensitive:
 *   L0_public_external      — public / external safe to ship verbatim
 *   L1_metadata_only        — schema, counts, tags only
 *   L2_summary_aggregate    — aggregated, anonymized summary
 *   L3_redacted_extract     — extract with PII / regulated fields removed
 *   L4_sensitive_raw_data   — raw record-level sensitive payload
 */
export type AgentDatasetSharingLevel =
  | 'L0_public_external'
  | 'L1_metadata_only'
  | 'L2_summary_aggregate'
  | 'L3_redacted_extract'
  | 'L4_sensitive_raw_data';

/**
 * The state of an evidence-trust ladder approval that gates whether
 * an agent may use a dataset for a given purpose. This is a local
 * mirror of TRUST1's `DatasetTrustLadderState`. Reconciled during
 * cherry-pick.
 */
export type AgentEvidenceApprovalState =
  | 'unsubmitted'
  | 'pending_review'
  | 'conditionally_approved'
  | 'explicit_approved'
  | 'rejected'
  | 'revoked';

/**
 * Reason a (agent, purpose, level, approval) decision was blocked.
 */
export type AgentDataAccessBlockReason =
  | 'level_outside_agent_envelope'
  | 'sensitive_raw_requires_explicit_approval'
  | 'cite_as_evidence_requires_usable_evidence'
  | 'executive_brief_prefers_aggregate'
  | 'purpose_not_authorized_for_agent'
  | 'approval_revoked_or_rejected';

/** A single (agent, purpose, level) permission entry. */
export interface AgentDatasetPermission {
  /** Sharing level the rule applies to. */
  level: AgentDatasetSharingLevel;
  /**
   * Whether this permission is allowed by default for the agent at
   * this purpose. May still be blocked at evaluation time by
   * approval-state gates.
   */
  allowedByDefault: boolean;
  /**
   * Whether the level requires `approvalState === 'explicit_approved'`
   * to unblock. Currently true only for L4_sensitive_raw_data.
   */
  requiresExplicitApproval: boolean;
  /** Whether this permission is the preferred level for this purpose. */
  preferred: boolean;
  /** Single-sentence justification (no fabricated metric / dollar). */
  rationale: string;
}

/** A policy entry for one (agent, purpose) tuple. */
export interface AgentDataAccessPolicy {
  /** Stable id: `agent_data_access:<agent>:<purpose>`. */
  id: string;
  agent: AgentDataAccessAgent;
  purpose: AgentDataUsePurpose;
  /**
   * Per-level permission map for this (agent, purpose). Always
   * contains an entry for every canonical sharing level so the
   * matrix is dense and machine-readable.
   */
  permissions: ReadonlyArray<AgentDatasetPermission>;
  /** Single-sentence policy summary surfaced in Steward UI. */
  summary: string;
  createdFrom: 'deterministic_agent_data_access_seed';
}

/** A single decision returned by `evaluateAgentDataAccess`. */
export interface AgentDataAccessDecision {
  agent: AgentDataAccessAgent;
  purpose: AgentDataUsePurpose;
  datasetLevel: AgentDatasetSharingLevel;
  approvalState: AgentEvidenceApprovalState;
  /** Final allow/deny verdict for this decision. */
  allowed: boolean;
  /**
   * Whether the matching policy permission is the preferred level
   * for this (agent, purpose). Always false on a blocked decision.
   */
  preferredLevel: boolean;
  /** Single-sentence rationale (always populated). */
  rationale: string;
  /** Populated only when `allowed === false`. */
  blockReason: AgentDataAccessBlockReason | null;
  createdFrom: 'deterministic_agent_data_access_seed';
}

export interface AgentDataAccessMatrixSummary {
  totalPolicies: number;
  byAgent: Record<AgentDataAccessAgent, number>;
  byPurpose: Record<AgentDataUsePurpose, number>;
  permissionsRequiringExplicitApproval: number;
  preferredAggregateForExecutiveBrief: number;
}

export interface AgentDataAccessMatrix {
  generatedFrom: 'deterministic_agent_data_access_seed';
  policies: ReadonlyArray<AgentDataAccessPolicy>;
  summary: AgentDataAccessMatrixSummary;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

export const AGENT_DATA_ACCESS_AGENTS_IN_ORDER: ReadonlyArray<AgentDataAccessAgent> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

export const AGENT_DATA_USE_PURPOSES_IN_ORDER: ReadonlyArray<AgentDataUsePurpose> = [
  'summarize',
  'recommend',
  'cite_as_evidence',
  'generate_deliverable',
  'evaluate_governance',
  'create_mission',
  'produce_executive_brief',
];

export const AGENT_DATASET_SHARING_LEVELS_IN_ORDER: ReadonlyArray<AgentDatasetSharingLevel> = [
  'L0_public_external',
  'L1_metadata_only',
  'L2_summary_aggregate',
  'L3_redacted_extract',
  'L4_sensitive_raw_data',
];

export const AGENT_EVIDENCE_APPROVAL_STATES_IN_ORDER: ReadonlyArray<AgentEvidenceApprovalState> = [
  'unsubmitted',
  'pending_review',
  'conditionally_approved',
  'explicit_approved',
  'rejected',
  'revoked',
];

// ---------------------------------------------------------------------
// Policy authorship rules
// ---------------------------------------------------------------------
//
// Encoded policy intent (mirrors TRUST2 spec):
//   - Steward      : policy / readiness data only.
//   - Sentinel     : evidence candidates + patterns.
//   - Nexus        : agent-approved program / workshop / deliverable
//                    data.
//   - Atlas        : aggregate / approved executive signals only.
//   - L4 sensitive raw data is blocked unless approval state is
//     `explicit_approved`.
//   - cite_as_evidence requires a usable evidence trust state.
//   - produce_executive_brief prefers L2_summary_aggregate.

/**
 * Per-agent envelope: which sharing levels the agent may ever touch
 * (subject to per-purpose narrowing below).
 */
const AGENT_ENVELOPE: Record<AgentDataAccessAgent, ReadonlySet<AgentDatasetSharingLevel>> = {
  // Nexus may use program / workshop / deliverable data once an agent
  // has approved access; spans most levels because deliverables can
  // legitimately surface raw text snippets when the underlying
  // evidence has been explicitly approved.
  nexus: new Set<AgentDatasetSharingLevel>([
    'L0_public_external',
    'L1_metadata_only',
    'L2_summary_aggregate',
    'L3_redacted_extract',
    'L4_sensitive_raw_data',
  ]),
  // Sentinel evaluates evidence and patterns; needs to inspect
  // record-level extracts, but only when explicitly approved.
  sentinel: new Set<AgentDatasetSharingLevel>([
    'L0_public_external',
    'L1_metadata_only',
    'L2_summary_aggregate',
    'L3_redacted_extract',
    'L4_sensitive_raw_data',
  ]),
  // Atlas surfaces executive signals; aggregate / approved only.
  atlas: new Set<AgentDatasetSharingLevel>([
    'L0_public_external',
    'L1_metadata_only',
    'L2_summary_aggregate',
  ]),
  // Steward inspects policy / readiness state; never touches raw or
  // redacted record-level content directly.
  steward: new Set<AgentDatasetSharingLevel>([
    'L0_public_external',
    'L1_metadata_only',
    'L2_summary_aggregate',
  ]),
};

/**
 * Per-(agent, purpose) authorization. If a purpose is missing from
 * the agent's set, the policy returns `allowedByDefault: false` for
 * every level (and `evaluateAgentDataAccess` blocks with
 * `purpose_not_authorized_for_agent`).
 */
const AGENT_PURPOSES: Record<AgentDataAccessAgent, ReadonlySet<AgentDataUsePurpose>> = {
  nexus: new Set<AgentDataUsePurpose>([
    'summarize',
    'recommend',
    'cite_as_evidence',
    'generate_deliverable',
    'create_mission',
  ]),
  sentinel: new Set<AgentDataUsePurpose>([
    'summarize',
    'recommend',
    'cite_as_evidence',
    'evaluate_governance',
    'create_mission',
  ]),
  atlas: new Set<AgentDataUsePurpose>([
    'summarize',
    'recommend',
    'create_mission',
    'produce_executive_brief',
  ]),
  steward: new Set<AgentDataUsePurpose>([
    'summarize',
    'recommend',
    'evaluate_governance',
    'create_mission',
    'produce_executive_brief',
  ]),
};

/**
 * Per-purpose preferred sharing level. Used to mark `preferred`
 * in the policy matrix. Notably:
 *   - produce_executive_brief → L2_summary_aggregate
 *   - cite_as_evidence       → L3_redacted_extract (raw record-level
 *     evidence is gated to L4 with explicit approval)
 *   - generate_deliverable   → L3_redacted_extract
 *   - evaluate_governance    → L1_metadata_only
 */
const PREFERRED_LEVEL: Record<AgentDataUsePurpose, AgentDatasetSharingLevel> = {
  summarize: 'L2_summary_aggregate',
  recommend: 'L2_summary_aggregate',
  cite_as_evidence: 'L3_redacted_extract',
  generate_deliverable: 'L3_redacted_extract',
  evaluate_governance: 'L1_metadata_only',
  create_mission: 'L1_metadata_only',
  produce_executive_brief: 'L2_summary_aggregate',
};

/**
 * Approval states that satisfy the evidence-trust gate for purposes
 * that require usable evidence (today: `cite_as_evidence`).
 */
const USABLE_EVIDENCE_APPROVAL_STATES: ReadonlySet<AgentEvidenceApprovalState> = new Set<AgentEvidenceApprovalState>([
  'conditionally_approved',
  'explicit_approved',
]);

/**
 * Approval states that fully unblock L4_sensitive_raw_data.
 * Only `explicit_approved` qualifies.
 */
const EXPLICIT_APPROVED: AgentEvidenceApprovalState = 'explicit_approved';

// ---------------------------------------------------------------------
// Policy authorship
// ---------------------------------------------------------------------

function buildPermission(
  agent: AgentDataAccessAgent,
  purpose: AgentDataUsePurpose,
  level: AgentDatasetSharingLevel,
): AgentDatasetPermission {
  const inEnvelope = AGENT_ENVELOPE[agent].has(level);
  const purposeAuthorized = AGENT_PURPOSES[agent].has(purpose);
  const allowedByDefault = inEnvelope && purposeAuthorized;
  const requiresExplicitApproval = level === 'L4_sensitive_raw_data';
  const preferred = allowedByDefault && PREFERRED_LEVEL[purpose] === level;

  let rationale: string;
  if (!purposeAuthorized) {
    rationale = `${agentLabel(agent)} is not authorized for ${purposeLabel(purpose)}; level ${level} is not exposed for this purpose.`;
  } else if (!inEnvelope) {
    rationale = `${agentLabel(agent)} envelope does not include ${level}; this level remains unavailable for ${purposeLabel(purpose)}.`;
  } else if (requiresExplicitApproval) {
    rationale = `${agentLabel(agent)} may use ${level} for ${purposeLabel(purpose)} only when the evidence trust ladder is in explicit_approved state.`;
  } else if (preferred) {
    rationale = `${agentLabel(agent)} prefers ${level} for ${purposeLabel(purpose)}; this is the canonical sharing level for that purpose.`;
  } else {
    rationale = `${agentLabel(agent)} may use ${level} for ${purposeLabel(purpose)} when the dataset is otherwise eligible.`;
  }

  return {
    level,
    allowedByDefault,
    requiresExplicitApproval,
    preferred,
    rationale,
  };
}

function agentLabel(agent: AgentDataAccessAgent): string {
  switch (agent) {
    case 'nexus':
      return 'Nexus';
    case 'sentinel':
      return 'Sentinel';
    case 'atlas':
      return 'Atlas';
    case 'steward':
      return 'Steward';
  }
}

function purposeLabel(purpose: AgentDataUsePurpose): string {
  switch (purpose) {
    case 'summarize':
      return 'summarize';
    case 'recommend':
      return 'recommend';
    case 'cite_as_evidence':
      return 'cite as evidence';
    case 'generate_deliverable':
      return 'generate deliverable';
    case 'evaluate_governance':
      return 'evaluate governance';
    case 'create_mission':
      return 'create mission';
    case 'produce_executive_brief':
      return 'produce executive brief';
  }
}

function policySummary(
  agent: AgentDataAccessAgent,
  purpose: AgentDataUsePurpose,
): string {
  const purposeAuthorized = AGENT_PURPOSES[agent].has(purpose);
  if (!purposeAuthorized) {
    return `${agentLabel(agent)} is not authorized for ${purposeLabel(purpose)}; no sharing level is permitted for this combination.`;
  }
  const preferred = PREFERRED_LEVEL[purpose];
  return `${agentLabel(agent)} may ${purposeLabel(purpose)}; preferred sharing level is ${preferred}, and L4_sensitive_raw_data requires explicit_approved evidence trust state.`;
}

function buildPolicy(
  agent: AgentDataAccessAgent,
  purpose: AgentDataUsePurpose,
): AgentDataAccessPolicy {
  const permissions = AGENT_DATASET_SHARING_LEVELS_IN_ORDER.map((level) =>
    buildPermission(agent, purpose, level),
  );
  return {
    id: `agent_data_access:${agent}:${purpose}`,
    agent,
    purpose,
    permissions,
    summary: policySummary(agent, purpose),
    createdFrom: 'deterministic_agent_data_access_seed',
  };
}

// Pre-built policy list, frozen at module load. Pure: same call ->
// identical output.
const POLICIES: ReadonlyArray<AgentDataAccessPolicy> = (() => {
  const out: AgentDataAccessPolicy[] = [];
  for (const agent of AGENT_DATA_ACCESS_AGENTS_IN_ORDER) {
    for (const purpose of AGENT_DATA_USE_PURPOSES_IN_ORDER) {
      // Only emit a policy entry when the agent is authorized for the
      // purpose. This keeps the matrix honest — Atlas does not get a
      // `cite_as_evidence` row, etc.
      if (!AGENT_PURPOSES[agent].has(purpose)) continue;
      out.push(buildPolicy(agent, purpose));
    }
  }
  return out;
})();

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Return the deterministic list of (agent, purpose) policies. Pure.
 */
export function listAgentDataAccessPolicies(): ReadonlyArray<AgentDataAccessPolicy> {
  return POLICIES;
}

/**
 * Build the full agent / purpose / level matrix with summary counts.
 * Pure: same call → identical output.
 */
export function buildAgentDataAccessMatrix(): AgentDataAccessMatrix {
  const policies = POLICIES;
  const summary = summarizeAgentDataAccessMatrix({
    generatedFrom: 'deterministic_agent_data_access_seed',
    policies,
    summary: zeroSummary(),
  });
  return {
    generatedFrom: 'deterministic_agent_data_access_seed',
    policies,
    summary,
  };
}

/**
 * Aggregate counts over a matrix (or partial matrix). Pure.
 */
export function summarizeAgentDataAccessMatrix(
  matrix: AgentDataAccessMatrix,
): AgentDataAccessMatrixSummary {
  const byAgent = zeroByAgent();
  const byPurpose = zeroByPurpose();
  let permissionsRequiringExplicitApproval = 0;
  let preferredAggregateForExecutiveBrief = 0;
  for (const p of matrix.policies) {
    byAgent[p.agent] += 1;
    byPurpose[p.purpose] += 1;
    for (const perm of p.permissions) {
      if (perm.requiresExplicitApproval) {
        permissionsRequiringExplicitApproval += 1;
      }
      if (
        p.purpose === 'produce_executive_brief' &&
        perm.level === 'L2_summary_aggregate' &&
        perm.preferred
      ) {
        preferredAggregateForExecutiveBrief += 1;
      }
    }
  }
  return {
    totalPolicies: matrix.policies.length,
    byAgent,
    byPurpose,
    permissionsRequiringExplicitApproval,
    preferredAggregateForExecutiveBrief,
  };
}

/**
 * Evaluate a single (agent, purpose, datasetLevel, approvalState)
 * tuple against the policy matrix. Pure: same input → identical
 * output. Always returns a populated `rationale`; populates
 * `blockReason` when `allowed === false`.
 */
export function evaluateAgentDataAccess(
  agent: AgentDataAccessAgent,
  purpose: AgentDataUsePurpose,
  datasetLevel: AgentDatasetSharingLevel,
  approvalState: AgentEvidenceApprovalState,
): AgentDataAccessDecision {
  const purposeAuthorized = AGENT_PURPOSES[agent].has(purpose);
  if (!purposeAuthorized) {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `${agentLabel(agent)} is not authorized for ${purposeLabel(purpose)}; access is denied at every sharing level.`,
      blockReason: 'purpose_not_authorized_for_agent',
    });
  }

  if (approvalState === 'rejected' || approvalState === 'revoked') {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `Evidence trust state is ${approvalState}; ${agentLabel(agent)} cannot use this dataset for ${purposeLabel(purpose)} until it is re-approved.`,
      blockReason: 'approval_revoked_or_rejected',
    });
  }

  if (!AGENT_ENVELOPE[agent].has(datasetLevel)) {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `${agentLabel(agent)} envelope does not include ${datasetLevel}; ${purposeLabel(purpose)} on this dataset is denied.`,
      blockReason: 'level_outside_agent_envelope',
    });
  }

  if (
    datasetLevel === 'L4_sensitive_raw_data' &&
    approvalState !== EXPLICIT_APPROVED
  ) {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `L4_sensitive_raw_data requires explicit_approved evidence trust state; current state is ${approvalState}.`,
      blockReason: 'sensitive_raw_requires_explicit_approval',
    });
  }

  if (
    purpose === 'cite_as_evidence' &&
    !USABLE_EVIDENCE_APPROVAL_STATES.has(approvalState)
  ) {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `cite_as_evidence requires a usable evidence trust state (conditionally_approved or explicit_approved); current state is ${approvalState}.`,
      blockReason: 'cite_as_evidence_requires_usable_evidence',
    });
  }

  if (
    purpose === 'produce_executive_brief' &&
    datasetLevel !== 'L2_summary_aggregate' &&
    datasetLevel !== 'L0_public_external' &&
    datasetLevel !== 'L1_metadata_only'
  ) {
    return decision({
      agent,
      purpose,
      datasetLevel,
      approvalState,
      allowed: false,
      preferredLevel: false,
      rationale: `produce_executive_brief prefers L2_summary_aggregate; ${datasetLevel} is not allowed for executive briefs.`,
      blockReason: 'executive_brief_prefers_aggregate',
    });
  }

  const preferred = PREFERRED_LEVEL[purpose] === datasetLevel;
  const rationale = preferred
    ? `${agentLabel(agent)} may use ${datasetLevel} for ${purposeLabel(purpose)}; this is the preferred level.`
    : `${agentLabel(agent)} may use ${datasetLevel} for ${purposeLabel(purpose)} (preferred level is ${PREFERRED_LEVEL[purpose]}).`;

  return decision({
    agent,
    purpose,
    datasetLevel,
    approvalState,
    allowed: true,
    preferredLevel: preferred,
    rationale,
    blockReason: null,
  });
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function decision(input: {
  agent: AgentDataAccessAgent;
  purpose: AgentDataUsePurpose;
  datasetLevel: AgentDatasetSharingLevel;
  approvalState: AgentEvidenceApprovalState;
  allowed: boolean;
  preferredLevel: boolean;
  rationale: string;
  blockReason: AgentDataAccessBlockReason | null;
}): AgentDataAccessDecision {
  return {
    agent: input.agent,
    purpose: input.purpose,
    datasetLevel: input.datasetLevel,
    approvalState: input.approvalState,
    allowed: input.allowed,
    preferredLevel: input.preferredLevel,
    rationale: input.rationale,
    blockReason: input.blockReason,
    createdFrom: 'deterministic_agent_data_access_seed',
  };
}

function zeroByAgent(): Record<AgentDataAccessAgent, number> {
  return {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
}

function zeroByPurpose(): Record<AgentDataUsePurpose, number> {
  return {
    summarize: 0,
    recommend: 0,
    cite_as_evidence: 0,
    generate_deliverable: 0,
    evaluate_governance: 0,
    create_mission: 0,
    produce_executive_brief: 0,
  };
}

function zeroSummary(): AgentDataAccessMatrixSummary {
  return {
    totalPolicies: 0,
    byAgent: zeroByAgent(),
    byPurpose: zeroByPurpose(),
    permissionsRequiringExplicitApproval: 0,
    preferredAggregateForExecutiveBrief: 0,
  };
}
