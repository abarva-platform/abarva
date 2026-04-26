// TRUST1 · Dataset Trust Model + Data Sharing Levels.
//
// Pure deterministic read model that defines progressive client data
// sharing levels and the dataset trust ladder. Encodes the canonical
// rules so clients can engage AbarVa without granting broad raw-data
// access:
//
//   loaded            ≠ usable
//   available         ≠ agent-usable
//   raw data          not required by default
//   evidence          backed by manifests, not raw records
//   agent use         requires explicit policy
//   approval          never fabricated
//
// No live connector sync, no real upload pipeline, no production
// evidence registry, no DB persistence, no Date.now() reads, no
// random IDs, no model calls.
//
// This module does NOT import:
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

/**
 * Canonical progressive data sharing levels. Ordered from least
 * sensitive (L0, public/external) to most sensitive (L4, raw).
 *
 * - L0_public_external — public marketing material, public filings,
 *   public reference architecture; no client confidentiality.
 * - L1_metadata_only — dataset titles, owners, schema descriptions,
 *   row counts; no underlying values shared.
 * - L2_summary_aggregate — redacted aggregates, KPI summaries, totals
 *   and bands; no row-level fidelity.
 * - L3_redacted_extract — sample extracts with sensitive fields
 *   redacted; selectively shared for low-risk discovery work.
 * - L4_sensitive_raw_data — raw records, PII / PHI, contracts, and
 *   regulated content; requires explicit named approval.
 */
export type DatasetTrustLevel =
  | 'L0_public_external'
  | 'L1_metadata_only'
  | 'L2_summary_aggregate'
  | 'L3_redacted_extract'
  | 'L4_sensitive_raw_data';

/**
 * Trust ladder for a dataset's progression toward decision-grade use.
 * Mirrors the ADM1 §J philosophy — loaded ≠ usable, available ≠
 * agent-usable.
 *
 * - loaded           — bytes are present in the platform.
 * - available        — discoverable / queryable as metadata.
 * - usable_evidence  — referenced via an evidence manifest, not raw.
 * - agent_usable     — explicit agent-use policy attached.
 * - decision_grade   — approved as input to a named decision artifact.
 */
export type DatasetTrustLadderState =
  | 'loaded'
  | 'available'
  | 'usable_evidence'
  | 'agent_usable'
  | 'decision_grade';

/** Sensitivity classification of the underlying records. */
export type DatasetSensitivity =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted_pii'
  | 'restricted_phi'
  | 'regulated_contract';

/**
 * Whether agents may use the dataset and under what policy. Agent use
 * is denied unless an explicit policy is attached.
 */
export type DatasetAgentUsePolicy =
  | 'denied_by_default'
  | 'metadata_only'
  | 'aggregate_only'
  | 'redacted_extract_only'
  | 'raw_with_named_approval';

/**
 * How evidence is supplied without exposing raw data. Evidence
 * manifests are the default; raw record reads are an exception.
 */
export type DatasetEvidenceUsePolicy =
  | 'no_evidence_yet'
  | 'manifest_only'
  | 'manifest_plus_aggregate'
  | 'manifest_plus_redacted_extract'
  | 'raw_record_read_with_approval';

/** Approval state — fabrication is not permitted. */
export type DatasetApprovalState =
  | 'not_required'
  | 'required_not_requested'
  | 'requested_pending'
  | 'approved'
  | 'denied'
  | 'expired';

/**
 * Outcome of evaluating a single dataset trust decision.
 * `permitted: false` always carries a non-empty `reasons` list.
 */
export interface DatasetTrustDecision {
  permitted: boolean;
  trustLevel: DatasetTrustLevel;
  ladderState: DatasetTrustLadderState;
  sensitivity: DatasetSensitivity;
  agentUsePolicy: DatasetAgentUsePolicy;
  evidenceUsePolicy: DatasetEvidenceUsePolicy;
  approvalState: DatasetApprovalState;
  reasons: ReadonlyArray<string>;
  /** Single-sentence Steward-facing recommendation. */
  guidance: string;
  createdFrom: 'deterministic_dataset_trust_seed';
}

/** A canonical sharing level descriptor (catalog row). */
export interface DatasetSharingLevelDescriptor {
  level: DatasetTrustLevel;
  ordinal: 0 | 1 | 2 | 3 | 4;
  label: string;
  description: string;
  rawDataExposed: boolean;
  approvalRequired: boolean;
  defaultAgentUsePolicy: DatasetAgentUsePolicy;
  defaultEvidenceUsePolicy: DatasetEvidenceUsePolicy;
}

/** A canonical ladder state descriptor. */
export interface DatasetTrustLadderDescriptor {
  state: DatasetTrustLadderState;
  ordinal: 0 | 1 | 2 | 3 | 4;
  label: string;
  description: string;
  /** True when this state alone permits agent runtime consumption. */
  permitsAgentUse: boolean;
  /** True when this state alone permits decision-artifact citation. */
  permitsDecisionUse: boolean;
}

/** Full deterministic trust model catalog. */
export interface DatasetTrustModel {
  generatedFrom: 'deterministic_dataset_trust_seed';
  sharingLevels: ReadonlyArray<DatasetSharingLevelDescriptor>;
  ladderStates: ReadonlyArray<DatasetTrustLadderDescriptor>;
  rules: ReadonlyArray<string>;
}

/** Input to evaluateDatasetTrustDecision. */
export interface DatasetTrustDecisionInput {
  datasetId: string;
  trustLevel: DatasetTrustLevel;
  ladderState: DatasetTrustLadderState;
  sensitivity: DatasetSensitivity;
  /** Whether an agent-use policy is explicitly attached. */
  hasAgentUsePolicy: boolean;
  /** Whether an evidence manifest is attached for citations. */
  hasEvidenceManifest: boolean;
  approvalState: DatasetApprovalState;
  /** Whether the request is asking for raw record reads. */
  requestsRawRecords: boolean;
  /** Whether the request is asking for agent runtime consumption. */
  requestsAgentUse: boolean;
}

/** Aggregated readiness summary across many decisions. */
export interface DatasetTrustReadinessSummary {
  total: number;
  permittedTotal: number;
  blockedTotal: number;
  byLevel: Record<DatasetTrustLevel, number>;
  byLadderState: Record<DatasetTrustLadderState, number>;
  byApprovalState: Record<DatasetApprovalState, number>;
  rawRequestsBlocked: number;
  agentRequestsBlocked: number;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

const ALL_SHARING_LEVELS: ReadonlyArray<DatasetTrustLevel> = [
  'L0_public_external',
  'L1_metadata_only',
  'L2_summary_aggregate',
  'L3_redacted_extract',
  'L4_sensitive_raw_data',
];

const ALL_LADDER_STATES: ReadonlyArray<DatasetTrustLadderState> = [
  'loaded',
  'available',
  'usable_evidence',
  'agent_usable',
  'decision_grade',
];

const ALL_APPROVAL_STATES: ReadonlyArray<DatasetApprovalState> = [
  'not_required',
  'required_not_requested',
  'requested_pending',
  'approved',
  'denied',
  'expired',
];

// ---------------------------------------------------------------------
// Canonical descriptors
// ---------------------------------------------------------------------

const SHARING_LEVEL_DESCRIPTORS: ReadonlyArray<DatasetSharingLevelDescriptor> = [
  {
    level: 'L0_public_external',
    ordinal: 0,
    label: 'L0 · Public / external',
    description:
      'Public marketing material, public filings, and public reference architecture. No client confidentiality involved.',
    rawDataExposed: false,
    approvalRequired: false,
    defaultAgentUsePolicy: 'metadata_only',
    defaultEvidenceUsePolicy: 'manifest_only',
  },
  {
    level: 'L1_metadata_only',
    ordinal: 1,
    label: 'L1 · Metadata only',
    description:
      'Dataset titles, owners, schema descriptions, and counts. Underlying values are not shared. Suitable for low-risk discovery and inventory mapping.',
    rawDataExposed: false,
    approvalRequired: false,
    defaultAgentUsePolicy: 'metadata_only',
    defaultEvidenceUsePolicy: 'manifest_only',
  },
  {
    level: 'L2_summary_aggregate',
    ordinal: 2,
    label: 'L2 · Summary / aggregate',
    description:
      'Redacted aggregates, KPI summaries, totals, and bands. No row-level fidelity. Suitable for value modeling and pattern detection without raw access.',
    rawDataExposed: false,
    approvalRequired: false,
    defaultAgentUsePolicy: 'aggregate_only',
    defaultEvidenceUsePolicy: 'manifest_plus_aggregate',
  },
  {
    level: 'L3_redacted_extract',
    ordinal: 3,
    label: 'L3 · Redacted extract',
    description:
      'Sample extracts with sensitive fields redacted. Selectively shared for grounded discovery and prototype evaluation. Sensitive identifiers are removed before sharing.',
    rawDataExposed: false,
    approvalRequired: false,
    defaultAgentUsePolicy: 'redacted_extract_only',
    defaultEvidenceUsePolicy: 'manifest_plus_redacted_extract',
  },
  {
    level: 'L4_sensitive_raw_data',
    ordinal: 4,
    label: 'L4 · Sensitive raw data',
    description:
      'Raw records, PII / PHI, contracts, and regulated content. Requires explicit named approval before any read. Never the default mode of engagement.',
    rawDataExposed: true,
    approvalRequired: true,
    defaultAgentUsePolicy: 'raw_with_named_approval',
    defaultEvidenceUsePolicy: 'raw_record_read_with_approval',
  },
];

const LADDER_DESCRIPTORS: ReadonlyArray<DatasetTrustLadderDescriptor> = [
  {
    state: 'loaded',
    ordinal: 0,
    label: 'Loaded',
    description:
      'Bytes are present in the platform. Loaded does not imply parsed, indexed, or usable.',
    permitsAgentUse: false,
    permitsDecisionUse: false,
  },
  {
    state: 'available',
    ordinal: 1,
    label: 'Available',
    description:
      'Discoverable and queryable as metadata. Available does not imply agent-usable; agent runtime consumption still requires an explicit policy.',
    permitsAgentUse: false,
    permitsDecisionUse: false,
  },
  {
    state: 'usable_evidence',
    ordinal: 2,
    label: 'Usable as evidence',
    description:
      'Referenced via an evidence manifest with a stable claim id. The manifest, not the raw record, is the citation surface.',
    permitsAgentUse: false,
    permitsDecisionUse: false,
  },
  {
    state: 'agent_usable',
    ordinal: 3,
    label: 'Agent-usable',
    description:
      'An explicit agent-use policy is attached and the evidence manifest is in place. Agents may consume the dataset within the bounds of that policy.',
    permitsAgentUse: true,
    permitsDecisionUse: false,
  },
  {
    state: 'decision_grade',
    ordinal: 4,
    label: 'Decision-grade',
    description:
      'Approved as input to a named decision artifact. Approval is recorded; nothing is fabricated.',
    permitsAgentUse: true,
    permitsDecisionUse: true,
  },
];

const TRUST_RULES: ReadonlyArray<string> = [
  'loaded does not imply usable; ladder must be lifted explicitly.',
  'available does not imply agent-usable; an explicit agent-use policy is required.',
  'raw record reads are not the default; sharing starts at metadata or aggregates.',
  'evidence is supplied via manifests by default, not raw records.',
  'agent use is denied by default; named policies unlock specific shapes only.',
  'L4 sensitive raw data requires explicit named approval before any read.',
  'approval state is never fabricated; absence of approval means denied.',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * List the canonical data sharing level descriptors in ordinal order.
 * Pure: same call → identical output.
 */
export function listDatasetSharingLevels(): ReadonlyArray<DatasetSharingLevelDescriptor> {
  return SHARING_LEVEL_DESCRIPTORS;
}

/**
 * Build the deterministic dataset trust model — the canonical sharing
 * level catalog, ladder catalog, and rule list. Pure.
 */
export function buildDatasetTrustModel(): DatasetTrustModel {
  return {
    generatedFrom: 'deterministic_dataset_trust_seed',
    sharingLevels: SHARING_LEVEL_DESCRIPTORS,
    ladderStates: LADDER_DESCRIPTORS,
    rules: TRUST_RULES,
  };
}

/**
 * Evaluate a single trust decision for a request against a dataset.
 * Returns a permitted/blocked decision with deterministic reasons and
 * Steward-facing guidance. Never grants raw L4 access without an
 * `approved` approval state. Pure.
 */
export function evaluateDatasetTrustDecision(
  input: DatasetTrustDecisionInput,
): DatasetTrustDecision {
  const reasons: string[] = [];
  const levelDescriptor = SHARING_LEVEL_DESCRIPTORS.find(
    (d) => d.level === input.trustLevel,
  );
  const ladderDescriptor = LADDER_DESCRIPTORS.find(
    (d) => d.state === input.ladderState,
  );

  // Defensive shape check (pure, deterministic — no throws).
  if (!levelDescriptor) {
    reasons.push('unknown_trust_level');
  }
  if (!ladderDescriptor) {
    reasons.push('unknown_ladder_state');
  }

  // Rule: loaded ≠ usable.
  if (input.ladderState === 'loaded') {
    reasons.push('rule_loaded_is_not_usable');
  }

  // Rule: available ≠ agent-usable when agent use is requested.
  if (input.requestsAgentUse && input.ladderState === 'available') {
    reasons.push('rule_available_is_not_agent_usable');
  }

  // Rule: agent use requires an explicit attached policy.
  if (input.requestsAgentUse && !input.hasAgentUsePolicy) {
    reasons.push('rule_agent_use_requires_explicit_policy');
  }

  // Rule: agent use further requires the agent_usable ladder state
  // (or decision_grade above it).
  if (
    input.requestsAgentUse &&
    input.ladderState !== 'agent_usable' &&
    input.ladderState !== 'decision_grade'
  ) {
    reasons.push('rule_agent_use_requires_agent_usable_state');
  }

  // Rule: raw record reads require L4 + explicit named approval.
  if (input.requestsRawRecords) {
    if (input.trustLevel !== 'L4_sensitive_raw_data') {
      reasons.push('rule_raw_records_only_via_L4');
    }
    if (input.approvalState !== 'approved') {
      reasons.push('rule_raw_records_require_explicit_approval');
    }
  }

  // Rule: L4 always requires explicit approval, even for non-raw asks.
  if (
    input.trustLevel === 'L4_sensitive_raw_data' &&
    input.approvalState !== 'approved'
  ) {
    reasons.push('rule_L4_requires_explicit_approval');
  }

  // Rule: evidence is manifest-by-default; non-raw asks should have a
  // manifest attached when ladderState >= usable_evidence.
  const ladderOrdinal = ladderDescriptor ? ladderDescriptor.ordinal : 0;
  if (
    !input.requestsRawRecords &&
    ladderOrdinal >= 2 &&
    !input.hasEvidenceManifest
  ) {
    reasons.push('rule_evidence_requires_manifest');
  }

  // Rule: never fabricate approval — denied / expired blocks any use
  // of L4 outright.
  if (
    input.trustLevel === 'L4_sensitive_raw_data' &&
    (input.approvalState === 'denied' || input.approvalState === 'expired')
  ) {
    reasons.push('rule_no_fake_approval');
  }

  const permitted = reasons.length === 0;

  const agentUsePolicy: DatasetAgentUsePolicy = input.hasAgentUsePolicy
    ? levelDescriptor
      ? levelDescriptor.defaultAgentUsePolicy
      : 'denied_by_default'
    : 'denied_by_default';

  const evidenceUsePolicy: DatasetEvidenceUsePolicy = input.hasEvidenceManifest
    ? levelDescriptor
      ? levelDescriptor.defaultEvidenceUsePolicy
      : 'no_evidence_yet'
    : 'no_evidence_yet';

  const guidance = buildDecisionGuidance(input, permitted, reasons);

  return {
    permitted,
    trustLevel: input.trustLevel,
    ladderState: input.ladderState,
    sensitivity: input.sensitivity,
    agentUsePolicy,
    evidenceUsePolicy,
    approvalState: input.approvalState,
    reasons,
    guidance,
    createdFrom: 'deterministic_dataset_trust_seed',
  };
}

/**
 * Aggregate trust readiness across many decisions. Pure.
 */
export function summarizeDatasetTrustReadiness(
  items: ReadonlyArray<DatasetTrustDecision>,
): DatasetTrustReadinessSummary {
  const byLevel = emptyByLevel();
  const byLadderState = emptyByLadderState();
  const byApprovalState = emptyByApprovalState();
  let permittedTotal = 0;
  let blockedTotal = 0;
  let rawRequestsBlocked = 0;
  let agentRequestsBlocked = 0;
  for (const it of items) {
    byLevel[it.trustLevel] += 1;
    byLadderState[it.ladderState] += 1;
    byApprovalState[it.approvalState] += 1;
    if (it.permitted) {
      permittedTotal += 1;
    } else {
      blockedTotal += 1;
      if (it.reasons.includes('rule_raw_records_require_explicit_approval')) {
        rawRequestsBlocked += 1;
      }
      if (
        it.reasons.includes('rule_agent_use_requires_explicit_policy') ||
        it.reasons.includes('rule_agent_use_requires_agent_usable_state') ||
        it.reasons.includes('rule_available_is_not_agent_usable')
      ) {
        agentRequestsBlocked += 1;
      }
    }
  }
  return {
    total: items.length,
    permittedTotal,
    blockedTotal,
    byLevel,
    byLadderState,
    byApprovalState,
    rawRequestsBlocked,
    agentRequestsBlocked,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const DATASET_SHARING_LEVELS_IN_ORDER: ReadonlyArray<DatasetTrustLevel> =
  ALL_SHARING_LEVELS;

export const DATASET_TRUST_LADDER_STATES_IN_ORDER: ReadonlyArray<DatasetTrustLadderState> =
  ALL_LADDER_STATES;

export const DATASET_APPROVAL_STATES_IN_ORDER: ReadonlyArray<DatasetApprovalState> =
  ALL_APPROVAL_STATES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildDecisionGuidance(
  input: DatasetTrustDecisionInput,
  permitted: boolean,
  reasons: ReadonlyArray<string>,
): string {
  if (permitted) {
    if (input.ladderState === 'decision_grade') {
      return 'Approved as a decision-grade input; refresh approval before each citation cycle.';
    }
    if (input.ladderState === 'agent_usable') {
      return 'Agent-usable within the attached policy; promote to decision_grade only after a named decision approval.';
    }
    if (input.ladderState === 'usable_evidence') {
      return 'Evidence manifest attached; attach an explicit agent-use policy to lift to agent_usable.';
    }
    if (input.ladderState === 'available') {
      return 'Available as metadata; attach an evidence manifest before any agent or decision use.';
    }
    return 'Loaded only; lift to available before any downstream use.';
  }
  if (reasons.includes('rule_L4_requires_explicit_approval')) {
    return 'L4 sensitive raw data is blocked until a named approval is recorded; no agent or decision use is permitted.';
  }
  if (reasons.includes('rule_raw_records_require_explicit_approval')) {
    return 'Raw record reads are blocked until a named approval is recorded; default to manifest plus aggregate or redacted extract.';
  }
  if (reasons.includes('rule_no_fake_approval')) {
    return 'Approval is denied or expired; refresh the approval before any L4 use.';
  }
  if (reasons.includes('rule_agent_use_requires_explicit_policy')) {
    return 'Agent use is denied by default; attach an explicit agent-use policy before allowing agent runtime consumption.';
  }
  if (reasons.includes('rule_agent_use_requires_agent_usable_state')) {
    return 'Lift the dataset to agent_usable on the trust ladder before allowing agent runtime consumption.';
  }
  if (reasons.includes('rule_available_is_not_agent_usable')) {
    return 'Available metadata is not agent-usable; lift to usable_evidence and attach an agent-use policy.';
  }
  if (reasons.includes('rule_evidence_requires_manifest')) {
    return 'Attach an evidence manifest before citing this dataset; raw records are not the default surface.';
  }
  if (reasons.includes('rule_loaded_is_not_usable')) {
    return 'Loaded only; lift to available before any downstream use.';
  }
  return 'Blocked by trust rules; resolve the listed reasons before re-evaluating.';
}

function emptyByLevel(): Record<DatasetTrustLevel, number> {
  return {
    L0_public_external: 0,
    L1_metadata_only: 0,
    L2_summary_aggregate: 0,
    L3_redacted_extract: 0,
    L4_sensitive_raw_data: 0,
  };
}

function emptyByLadderState(): Record<DatasetTrustLadderState, number> {
  return {
    loaded: 0,
    available: 0,
    usable_evidence: 0,
    agent_usable: 0,
    decision_grade: 0,
  };
}

function emptyByApprovalState(): Record<DatasetApprovalState, number> {
  return {
    not_required: 0,
    required_not_requested: 0,
    requested_pending: 0,
    approved: 0,
    denied: 0,
    expired: 0,
  };
}
