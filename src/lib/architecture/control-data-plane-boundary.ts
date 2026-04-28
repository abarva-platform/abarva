// AZLAB2 - Control Plane / Data Plane Boundary Contract.
//
// Pure type-only and deterministic data module. No network calls, no model
// calls, no 'use client', no provider SDK, no fetch, no Date.now, no
// Math.random, no agent / source / sentinel / atlas / nexus / auth / supabase
// imports, no UI, no persistence.
//
// This module defines the formal boundary contract between the AbarVa control
// plane and the data plane. The boundary governs what data types may cross in
// either direction, under what policy, and what audit obligations apply.
//
// Key invariants (structurally enforced by literal types):
//   - Raw dataset content NEVER crosses from the data plane to the control
//     plane. rawDataBlocked: true on all relevant BoundaryRules.
//   - EvidenceRequests carry includesRawData: false and
//     includesMetadataOnly: true as literal types — not runtime flags.
//   - EvidenceResponses carry containsRawData: false as a literal type.
//   - ModelGatewayPolicyExchange carries containsModelWeights: false and
//     containsApiKeys: false as literal types.
//   - Every evidence request crossing produces an audit event (auditEventRequired: true).
//
// The control plane orchestrates missions, policies, tenant configuration, and
// routing hints. The data plane holds raw datasets, evidence ledger entries,
// vector indexes, graph edges, and audit streams. The boundary is the only
// legal seam between them: the control plane never reads raw data, and the
// data plane never receives tenant secrets or API keys.

// ---------------------------------------------------------------------
// Canonical direction and policy types.
// ---------------------------------------------------------------------

export type BoundaryDirection = 'control_to_data' | 'data_to_control';

export type CrossingPolicy =
  | 'allowed'
  | 'blocked'
  | 'allowed_with_audit'
  | 'allowed_metadata_only';

export type FailureMode =
  | 'degrade_gracefully'
  | 'block_request'
  | 'use_cached'
  | 'surface_error';

// ---------------------------------------------------------------------
// Boundary rule: governs one category of data crossing in one direction.
// ---------------------------------------------------------------------

export interface BoundaryRule {
  /** Canonical name for the category of data being governed. */
  dataType: string;
  /** Direction this rule applies to. */
  direction: BoundaryDirection;
  /** Policy that applies when data of this type crosses in this direction. */
  crossingPolicy: CrossingPolicy;
  /** Human-readable rationale for this rule. */
  rationale: string;
  /** Whether crossing this boundary produces an audit event. */
  auditRequired: boolean;
  /** Whether raw (un-summarised, un-aggregated) data is blocked. */
  rawDataBlocked: boolean;
}

// ---------------------------------------------------------------------
// Evidence request: control plane requests evidence from data plane.
// Always metadata/summary only — never raw data.
// ---------------------------------------------------------------------

export interface EvidenceRequest {
  requestId: string;
  evidenceType:
    | 'metric_summary'
    | 'dataset_summary'
    | 'artifact_metadata'
    | 'model_policy';
  requestingPlane: 'control';
  servingPlane: 'data';
  /** Structural literal false — raw data is never included in evidence requests. */
  includesRawData: false;
  /** Structural literal true — only metadata/summaries are included. */
  includesMetadataOnly: true;
  /** Structural literal true — every evidence request generates an audit event. */
  auditEventRequired: true;
}

// ---------------------------------------------------------------------
// Evidence response: data plane returns summary, never raw data.
// ---------------------------------------------------------------------

export interface EvidenceResponse {
  requestId: string;
  status: 'success' | 'partial' | 'unavailable' | 'degraded';
  /** Structural literal false — boundary enforcement: raw data never returned. */
  containsRawData: false;
  /** Opaque reference to the evidence manifest on the data-plane side. */
  manifestReference: string;
  /** Human-readable summary of the evidence. */
  evidenceSummary: string;
  /** Audit event id recorded when this response crossed the boundary. */
  auditEventId: string;
}

// ---------------------------------------------------------------------
// Model gateway policy exchange: routing hints and rate-limits only.
// API keys and model weights never cross the boundary.
// ---------------------------------------------------------------------

export interface ModelGatewayPolicyExchange {
  direction: BoundaryDirection;
  policyType:
    | 'routing_hint'
    | 'rate_limit'
    | 'model_preference'
    | 'access_scope';
  /** Structural literal false — model weights never cross the boundary. */
  containsModelWeights: false;
  /** Structural literal false — API keys never cross the boundary. */
  containsApiKeys: false;
}

// ---------------------------------------------------------------------
// Boundary audit event: emitted each time the boundary is crossed.
// ---------------------------------------------------------------------

export interface BoundaryAuditEvent {
  eventId: string;
  timestamp: string;
  direction: BoundaryDirection;
  dataType: string;
  crossingPolicy: CrossingPolicy;
  outcome: 'allowed' | 'blocked';
  requestingAgent: string;
}

// ---------------------------------------------------------------------
// Top-level boundary contract.
// ---------------------------------------------------------------------

export interface ControlDataPlaneBoundaryContract {
  contractVersion: string;
  generatedAt: string;
  /** Structural literal true — this module contains no runtime calls. */
  deterministicOnly: true;
  /** Structural literal true — this module makes no network calls. */
  noNetworkCalls: true;
  rules: BoundaryRule[];
  allowedEvidenceRequestTypes: string[];
  failureModes: { mode: FailureMode; trigger: string; behavior: string }[];
  degradedModeBehavior: string;
}

// ---------------------------------------------------------------------
// Deterministic seed rules (at least 6, covering all required categories).
// ---------------------------------------------------------------------

const SEED_RULES: BoundaryRule[] = [
  {
    dataType: 'raw_dataset_content',
    direction: 'data_to_control',
    crossingPolicy: 'blocked',
    rationale:
      'Raw customer dataset rows, file contents, and unprocessed records must never leave the data plane. The control plane operates on summaries and manifests only.',
    auditRequired: true,
    rawDataBlocked: true,
  },
  {
    dataType: 'evidence_manifest',
    direction: 'data_to_control',
    crossingPolicy: 'allowed_with_audit',
    rationale:
      'Evidence manifests (metric summaries, source references, date ranges, verification posture) may cross to the control plane as structured metadata. Raw values are excluded; manifests reference but do not embed client data.',
    auditRequired: true,
    rawDataBlocked: true,
  },
  {
    dataType: 'artifact_metadata',
    direction: 'data_to_control',
    crossingPolicy: 'allowed_metadata_only',
    rationale:
      'Artifact identifiers, lifecycle states, and typed metadata may cross to the control plane to enable mission planning and deliverable tracking. Artifact content (file bytes, model outputs) stays in the data plane.',
    auditRequired: true,
    rawDataBlocked: true,
  },
  {
    dataType: 'audit_event_stream',
    direction: 'data_to_control',
    crossingPolicy: 'allowed_with_audit',
    rationale:
      'Audit events (who accessed what, policy outcomes, boundary crossings) flow from the data-plane audit store to the control plane for governance dashboards and compliance reporting. Individual raw access payloads are not included.',
    auditRequired: true,
    rawDataBlocked: true,
  },
  {
    dataType: 'model_routing_policy',
    direction: 'control_to_data',
    crossingPolicy: 'allowed_with_audit',
    rationale:
      'The control plane sends routing hints, rate-limit caps, and model-preference policies to the data-plane model gateway. Policies contain no API keys or model weights — only opaque routing tokens and capability scopes.',
    auditRequired: true,
    rawDataBlocked: false,
  },
  {
    dataType: 'user_pii',
    direction: 'data_to_control',
    crossingPolicy: 'blocked',
    rationale:
      'Personally identifiable information (names, emails, raw identifiers) must never leave the data plane. The control plane identifies users by opaque tenant-scoped handles only.',
    auditRequired: true,
    rawDataBlocked: true,
  },
  {
    dataType: 'tenant_configuration',
    direction: 'control_to_data',
    crossingPolicy: 'allowed_with_audit',
    rationale:
      'Tenant-level configuration (namespace keys, retention policy, feature flags) flows from the control plane to the data plane during provisioning and policy updates. API secrets are injected separately by the secret store and never transit this boundary.',
    auditRequired: true,
    rawDataBlocked: false,
  },
  {
    dataType: 'dataset_summary_statistics',
    direction: 'data_to_control',
    crossingPolicy: 'allowed_metadata_only',
    rationale:
      'Aggregate statistics (row counts, schema shape, trust-ladder state) may cross to the control plane so that agents can reason about dataset availability without touching raw rows.',
    auditRequired: false,
    rawDataBlocked: true,
  },
];

// ---------------------------------------------------------------------
// Deterministic seed failure modes (at least 3).
// ---------------------------------------------------------------------

const SEED_FAILURE_MODES: ControlDataPlaneBoundaryContract['failureModes'] = [
  {
    mode: 'degrade_gracefully',
    trigger: 'data_plane_unreachable_or_timeout',
    behavior:
      'Control plane continues operating with cached evidence summaries and manifests. Missing-data sections of context packs are marked as unavailable rather than fabricated. Agents are informed of the degraded state before proceeding.',
  },
  {
    mode: 'block_request',
    trigger: 'crossing_policy_is_blocked',
    behavior:
      'Any request that would carry blocked data types (raw_dataset_content, user_pii) across the boundary is rejected immediately. The requesting agent receives a structured error with the applicable BoundaryRule reference. No partial data leaks through.',
  },
  {
    mode: 'use_cached',
    trigger: 'evidence_manifest_stale_but_data_plane_available',
    behavior:
      'If the data plane returns a stale-manifest indicator (evidenceResponse.status === "partial"), the control plane uses the last-known-good manifest for advisory reads while queuing a background refresh. Agents are surfaced the cached state label.',
  },
  {
    mode: 'surface_error',
    trigger: 'audit_event_write_fails',
    behavior:
      'If an audit event cannot be durably written, the crossing that required the audit is itself blocked and an error is returned to the calling agent. Boundary crossings without durable audit are not silently permitted.',
  },
];

// ---------------------------------------------------------------------
// Factory: build the canonical boundary contract.
// ---------------------------------------------------------------------

export function buildControlDataPlaneBoundaryContract(): ControlDataPlaneBoundaryContract {
  return {
    contractVersion: '1.0.0',
    generatedAt: '2026-04-26',
    deterministicOnly: true,
    noNetworkCalls: true,
    rules: SEED_RULES,
    allowedEvidenceRequestTypes: [
      'metric_summary',
      'dataset_summary',
      'artifact_metadata',
      'model_policy',
    ],
    failureModes: SEED_FAILURE_MODES,
    degradedModeBehavior:
      'When the data plane is unreachable, the control plane continues on cached evidence summaries. Agents surface an honest "data plane degraded" notice in every context pack section that relies on live data plane reads. No fabricated evidence is emitted during degraded operation.',
  };
}

// ---------------------------------------------------------------------
// Factory: create a typed EvidenceRequest.
// Literal-type fields are set structurally — they cannot be overridden.
// ---------------------------------------------------------------------

export function createEvidenceRequest(
  evidenceType: EvidenceRequest['evidenceType'],
): EvidenceRequest {
  return {
    requestId: `er-${evidenceType}-seed`,
    evidenceType,
    requestingPlane: 'control',
    servingPlane: 'data',
    includesRawData: false,
    includesMetadataOnly: true,
    auditEventRequired: true,
  };
}

// ---------------------------------------------------------------------
// Factory: create a typed EvidenceResponse.
// containsRawData is always false — boundary enforcement.
// ---------------------------------------------------------------------

export function createEvidenceResponse(
  requestId: string,
  status: EvidenceResponse['status'],
): EvidenceResponse {
  return {
    requestId,
    status,
    containsRawData: false,
    manifestReference: `manifest-ref-${requestId}`,
    evidenceSummary: `Evidence summary for request ${requestId} (status: ${status})`,
    auditEventId: `audit-${requestId}`,
  };
}
