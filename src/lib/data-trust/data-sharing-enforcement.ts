// DATA1 · Data Sharing Levels L0-L4 Enforcement.
//
// Pure deterministic enforcement layer over the L0-L4 data sharing levels
// defined in TRUST1 (dataset-trust-model.ts). This module encodes the policy
// gate that evaluates whether a specific data request is permitted under the
// sharing level assigned to a dataset.
//
// TRUST1 defines the levels and the trust model. This module enforces them:
//   - evaluate whether a data request falls within the permitted boundary
//   - return a structured permit/block decision with reasons
//   - surface a Steward-facing action for each blocked request
//   - never infer intent — block first, require explicit policy to unblock
//
// Sharing level precedence (most permissive to most restrictive):
//   L0 public external → L1 metadata only → L2 summary aggregate
//   → L3 redacted extract → L4 sensitive raw data
//
// A request is blocked whenever the action requested exceeds the sharing
// level boundary of the dataset.
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

// ---------------------------------------------------------------------
// Enforcement vocabulary
// ---------------------------------------------------------------------

/**
 * The action being requested against a dataset. Each action maps to
 * a minimum permitted sharing level.
 *
 * - read_metadata          → permitted at L1+
 * - read_aggregate         → permitted at L2+
 * - read_redacted_extract  → permitted at L3+
 * - read_raw_records       → permitted at L4 with named approval only
 * - agent_context_build    → permitted at L2+ with explicit agent-use policy
 * - evidence_citation      → permitted at L1+ with evidence manifest attached
 * - decision_artifact_cite → permitted at L2+ with co_signed or audited verification
 */
export type DataSharingRequestAction =
  | 'read_metadata'
  | 'read_aggregate'
  | 'read_redacted_extract'
  | 'read_raw_records'
  | 'agent_context_build'
  | 'evidence_citation'
  | 'decision_artifact_cite';

/**
 * Enforcement context for a single data sharing request. The caller
 * supplies the dataset's current sharing level, the action requested,
 * and contextual flags.
 */
export interface DataSharingEnforcementInput {
  /** Stable dataset id for logging. */
  datasetId: string;
  /** The sharing level assigned to this dataset. */
  sharingLevel: DatasetTrustLevel;
  /** The action being requested. */
  action: DataSharingRequestAction;
  /**
   * True when an explicit agent-use policy is attached to this dataset.
   * Required for `agent_context_build`.
   */
  hasAgentUsePolicy: boolean;
  /**
   * True when an evidence manifest entry exists for this dataset.
   * Required for `evidence_citation` and `decision_artifact_cite`.
   */
  hasEvidenceManifest: boolean;
  /**
   * Verification posture of the manifest entry when relevant.
   * Required for `decision_artifact_cite`.
   */
  manifestVerification?:
    | 'self_attested'
    | 'owner_signed'
    | 'co_signed'
    | 'audited';
  /**
   * True when a named approval (approved state) is recorded for this
   * dataset. Required for L4 and raw record reads.
   */
  hasNamedApproval: boolean;
}

/** Outcome of evaluating a single data sharing enforcement request. */
export interface DataSharingEnforcementDecision {
  permitted: boolean;
  datasetId: string;
  sharingLevel: DatasetTrustLevel;
  action: DataSharingRequestAction;
  reasons: ReadonlyArray<string>;
  /** Single-sentence Steward-facing action. */
  stewardAction: string;
  createdFrom: 'deterministic_data_sharing_enforcement_seed';
}

/** Aggregated enforcement summary over many decisions. */
export interface DataSharingEnforcementSummary {
  total: number;
  permittedTotal: number;
  blockedTotal: number;
  byAction: Record<DataSharingRequestAction, number>;
  bySharingLevel: Record<DatasetTrustLevel, number>;
  rawReadBlockedTotal: number;
  agentUseBlockedTotal: number;
}

// ---------------------------------------------------------------------
// Canonical ordinals
// ---------------------------------------------------------------------

/**
 * Ordinal mapping for sharing levels. Lower is less sensitive.
 * Used to evaluate whether a request action is within the level boundary.
 */
const SHARING_LEVEL_ORDINAL: Record<DatasetTrustLevel, number> = {
  L0_public_external: 0,
  L1_metadata_only: 1,
  L2_summary_aggregate: 2,
  L3_redacted_extract: 3,
  L4_sensitive_raw_data: 4,
};

/**
 * Minimum sharing level ordinal required for each action. A request
 * is blocked when the dataset's sharing level ordinal is LESS THAN
 * the minimum required for the action.
 */
const ACTION_MINIMUM_LEVEL_ORDINAL: Record<DataSharingRequestAction, number> =
  {
    read_metadata: 1, // L1+
    read_aggregate: 2, // L2+
    read_redacted_extract: 3, // L3+
    read_raw_records: 4, // L4 only — also requires named approval
    agent_context_build: 2, // L2+ — also requires agent-use policy
    evidence_citation: 1, // L1+ — also requires evidence manifest
    decision_artifact_cite: 2, // L2+ — also requires manifest + co_signed/audited
  };

const ALL_ACTIONS: ReadonlyArray<DataSharingRequestAction> = [
  'read_metadata',
  'read_aggregate',
  'read_redacted_extract',
  'read_raw_records',
  'agent_context_build',
  'evidence_citation',
  'decision_artifact_cite',
];

const ALL_SHARING_LEVELS: ReadonlyArray<DatasetTrustLevel> = [
  'L0_public_external',
  'L1_metadata_only',
  'L2_summary_aggregate',
  'L3_redacted_extract',
  'L4_sensitive_raw_data',
];

// ---------------------------------------------------------------------
// Deterministic seed decisions (canonical fixture)
// ---------------------------------------------------------------------

const SEED_DECISIONS: ReadonlyArray<DataSharingEnforcementInput> = [
  {
    datasetId: 'ds-apex-contact-volume-q1',
    sharingLevel: 'L2_summary_aggregate',
    action: 'read_aggregate',
    hasAgentUsePolicy: false,
    hasEvidenceManifest: true,
    manifestVerification: 'owner_signed',
    hasNamedApproval: false,
  },
  {
    datasetId: 'ds-apex-agent-performance',
    sharingLevel: 'L3_redacted_extract',
    action: 'agent_context_build',
    hasAgentUsePolicy: true,
    hasEvidenceManifest: true,
    manifestVerification: 'co_signed',
    hasNamedApproval: false,
  },
  {
    datasetId: 'ds-apex-raw-employee-records',
    sharingLevel: 'L4_sensitive_raw_data',
    action: 'read_raw_records',
    hasAgentUsePolicy: false,
    hasEvidenceManifest: false,
    hasNamedApproval: false,
  },
  {
    datasetId: 'ds-apex-kpi-summary',
    sharingLevel: 'L2_summary_aggregate',
    action: 'decision_artifact_cite',
    hasAgentUsePolicy: false,
    hasEvidenceManifest: true,
    manifestVerification: 'audited',
    hasNamedApproval: false,
  },
  {
    datasetId: 'ds-apex-schema-catalog',
    sharingLevel: 'L1_metadata_only',
    action: 'evidence_citation',
    hasAgentUsePolicy: false,
    hasEvidenceManifest: true,
    manifestVerification: 'self_attested',
    hasNamedApproval: false,
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic seed enforcement input set. Pure.
 */
export function buildDataSharingEnforcementSeed(): ReadonlyArray<DataSharingEnforcementInput> {
  return SEED_DECISIONS;
}

/**
 * Evaluate a single data sharing enforcement decision. Pure.
 *
 * Returns a permitted/blocked decision with a non-empty reasons list
 * when blocked, and a Steward-facing action for the operator.
 */
export function evaluateDataSharingEnforcement(
  input: DataSharingEnforcementInput,
): DataSharingEnforcementDecision {
  const reasons: string[] = [];

  const levelOrdinal = SHARING_LEVEL_ORDINAL[input.sharingLevel] ?? -1;
  const minimumOrdinal = ACTION_MINIMUM_LEVEL_ORDINAL[input.action] ?? 99;

  // Rule: sharing level must meet or exceed the minimum for the action.
  if (levelOrdinal < minimumOrdinal) {
    reasons.push('sharing_level_below_minimum_for_action');
  }

  // Rule: raw record reads require L4 + named approval.
  if (input.action === 'read_raw_records') {
    if (input.sharingLevel !== 'L4_sensitive_raw_data') {
      reasons.push('raw_read_requires_L4_sharing_level');
    }
    if (!input.hasNamedApproval) {
      reasons.push('raw_read_requires_named_approval');
    }
  }

  // Rule: agent context build requires an explicit agent-use policy.
  if (input.action === 'agent_context_build' && !input.hasAgentUsePolicy) {
    reasons.push('agent_context_build_requires_agent_use_policy');
  }

  // Rule: evidence citation requires an evidence manifest.
  if (
    (input.action === 'evidence_citation' ||
      input.action === 'decision_artifact_cite') &&
    !input.hasEvidenceManifest
  ) {
    reasons.push('citation_requires_evidence_manifest');
  }

  // Rule: decision artifact citation requires co_signed or audited verification.
  if (input.action === 'decision_artifact_cite') {
    if (!input.manifestVerification) {
      reasons.push('decision_citation_requires_manifest_verification_posture');
    } else if (
      input.manifestVerification === 'self_attested' ||
      input.manifestVerification === 'owner_signed'
    ) {
      reasons.push('decision_citation_requires_co_signed_or_audited');
    }
  }

  // Rule: L4 always requires named approval regardless of action.
  if (
    input.sharingLevel === 'L4_sensitive_raw_data' &&
    !input.hasNamedApproval &&
    input.action !== 'read_metadata'
  ) {
    if (!reasons.includes('raw_read_requires_named_approval')) {
      reasons.push('L4_requires_named_approval');
    }
  }

  const permitted = reasons.length === 0;
  const stewardAction = buildStewardAction(input, permitted, reasons);

  return {
    permitted,
    datasetId: input.datasetId,
    sharingLevel: input.sharingLevel,
    action: input.action,
    reasons,
    stewardAction,
    createdFrom: 'deterministic_data_sharing_enforcement_seed',
  };
}

/**
 * Evaluate multiple enforcement inputs and return aggregated summary.
 * Pure.
 */
export function summarizeDataSharingEnforcement(
  items: ReadonlyArray<DataSharingEnforcementInput>,
): DataSharingEnforcementSummary {
  const byAction = emptyByAction();
  const bySharingLevel = emptyBySharingLevel();
  let permittedTotal = 0;
  let blockedTotal = 0;
  let rawReadBlockedTotal = 0;
  let agentUseBlockedTotal = 0;

  for (const item of items) {
    const decision = evaluateDataSharingEnforcement(item);
    byAction[item.action] += 1;
    bySharingLevel[item.sharingLevel] += 1;
    if (decision.permitted) {
      permittedTotal += 1;
    } else {
      blockedTotal += 1;
      if (decision.reasons.includes('raw_read_requires_named_approval')) {
        rawReadBlockedTotal += 1;
      }
      if (
        decision.reasons.includes(
          'agent_context_build_requires_agent_use_policy',
        )
      ) {
        agentUseBlockedTotal += 1;
      }
    }
  }

  return {
    total: items.length,
    permittedTotal,
    blockedTotal,
    byAction,
    bySharingLevel,
    rawReadBlockedTotal,
    agentUseBlockedTotal,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const DATA_SHARING_ACTIONS_IN_ORDER: ReadonlyArray<DataSharingRequestAction> =
  ALL_ACTIONS;

export const DATA_SHARING_LEVELS_IN_ORDER: ReadonlyArray<DatasetTrustLevel> =
  ALL_SHARING_LEVELS;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildStewardAction(
  input: DataSharingEnforcementInput,
  permitted: boolean,
  reasons: ReadonlyArray<string>,
): string {
  if (permitted) {
    if (input.action === 'read_raw_records') {
      return 'Raw read permitted under L4 with named approval on record.';
    }
    if (input.action === 'agent_context_build') {
      return 'Agent context build permitted under agent-use policy; monitor usage against the policy scope.';
    }
    if (input.action === 'decision_artifact_cite') {
      return 'Decision citation permitted; refresh verification posture before next citation cycle.';
    }
    return 'Request is within the permitted sharing level boundary.';
  }
  if (reasons.includes('raw_read_requires_named_approval')) {
    return 'Record a named approval before permitting raw record reads.';
  }
  if (reasons.includes('raw_read_requires_L4_sharing_level')) {
    return 'Elevate the dataset sharing level to L4 and record a named approval before raw reads.';
  }
  if (reasons.includes('agent_context_build_requires_agent_use_policy')) {
    return 'Attach an explicit agent-use policy to this dataset before allowing agent context build.';
  }
  if (reasons.includes('citation_requires_evidence_manifest')) {
    return 'Attach an evidence manifest entry before permitting citations.';
  }
  if (reasons.includes('decision_citation_requires_co_signed_or_audited')) {
    return 'Upgrade the manifest verification to co_signed or audited before decision artifact citation.';
  }
  if (reasons.includes('L4_requires_named_approval')) {
    return 'Record a named approval before any non-metadata use of L4 data.';
  }
  if (reasons.includes('sharing_level_below_minimum_for_action')) {
    return 'Elevate the dataset sharing level to permit this action, or restrict the request to a lower-level action.';
  }
  return 'Resolve the listed enforcement reasons before re-evaluating.';
}

function emptyByAction(): Record<DataSharingRequestAction, number> {
  return {
    read_metadata: 0,
    read_aggregate: 0,
    read_redacted_extract: 0,
    read_raw_records: 0,
    agent_context_build: 0,
    evidence_citation: 0,
    decision_artifact_cite: 0,
  };
}

function emptyBySharingLevel(): Record<DatasetTrustLevel, number> {
  return {
    L0_public_external: 0,
    L1_metadata_only: 0,
    L2_summary_aggregate: 0,
    L3_redacted_extract: 0,
    L4_sensitive_raw_data: 0,
  };
}
