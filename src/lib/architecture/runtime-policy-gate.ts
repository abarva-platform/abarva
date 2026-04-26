// SEC1 - Runtime Safety / Policy Gate Contract
//
// Deterministic, file-pure contract that names the safety / policy
// checks the runtime must apply BEFORE any tool call, model call,
// evidence use, dataset access, export, or cross-agent handoff. SEC1
// is a typed envelope plus pure helpers; it does not call any model,
// dispatch any tool, read any persistence layer, or write any audit
// ledger entry.
//
// SEC1 is the safety perimeter that wraps TOOL2 / TOOL3 / MG2 / EVID2
// / TRUST1 / TRUST2 / AUD2. Where TOOL2 names which tools exist and
// validates a call shape, and TOOL3 names the audit shape every
// dispatcher must emit, SEC1 names the YES / NO / WAIVER / REVIEW
// gate the dispatcher must consult before either ever fires. Every
// PolicyCheckResult records the canonical decision, a human-readable
// rationale, and the policyBasis the future runtime registry will
// resolve.
//
// Hygiene mirrors TOOL2 / TOOL3 / EVID2 / CTX2:
// - No imports from `@/lib/source`, `@/lib/sentinel`, `@/lib/atlas`,
//   `@/lib/nexus`, `@/lib/agent`, `@/lib/auth`, or supabase.
// - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
// - No anthropic / openai / model SDK imports.
// - No `useState` / `useEffect` (this is not a React module).
// - No placeholder language (Coming soon / TBD / Lorem ipsum).
// - No `await` / shell exec / fs writes.

// ---------------------------------------------------------------------
// Canonical check-kind tuple.
// ---------------------------------------------------------------------

export const POLICY_CHECK_KINDS = [
  'tenant_scope',
  'tool_use',
  'model_gateway_use',
  'evidence_use',
  'dataset_trust',
  'export_download',
  'agent_handoff',
] as const;

export type PolicyCheckKind = typeof POLICY_CHECK_KINDS[number];

// ---------------------------------------------------------------------
// Canonical decision tuple.
// ---------------------------------------------------------------------

export const POLICY_DECISIONS = [
  'allow',
  'deny',
  'require_waiver',
  'require_review',
] as const;

export type PolicyDecision = typeof POLICY_DECISIONS[number];

// ---------------------------------------------------------------------
// Canonical deny-reason tuple.
// ---------------------------------------------------------------------

export const POLICY_DENY_REASONS = [
  'tenant_scope_mismatch',
  'tool_not_registered',
  'tool_forbidden_for_actor',
  'model_gateway_not_live',
  'evidence_unusable',
  'dataset_trust_insufficient',
  'export_requires_approval',
  'agent_handoff_unauthorized',
  'governance_constraint_violated',
] as const;

export type PolicyDenyReason = typeof POLICY_DENY_REASONS[number];

// ---------------------------------------------------------------------
// Canonical reviewer-role tuple.
// ---------------------------------------------------------------------

export const POLICY_REVIEWER_ROLES = [
  'steward',
  'admin',
  'governance_reviewer',
  'tenant_admin',
] as const;

export type PolicyReviewerRole = typeof POLICY_REVIEWER_ROLES[number];

// ---------------------------------------------------------------------
// Public request / result / summary types.
// ---------------------------------------------------------------------

export interface PolicyCheckRequest {
  kind: PolicyCheckKind;
  actor: string;
  tenantKey: string;
  /** The subject of the check: the toolId, modelId, evidenceId,
   *  datasetId, exportId, or handoffId being evaluated. */
  subjectId: string;
  /** Optional second tenant key used for tenant_scope checks where the
   *  request and subject must share a tenant binding. */
  subjectTenantKey?: string;
  /** Optional sharing level for dataset_trust checks (L0..L4). */
  datasetSharingLevel?: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
  /** Optional approval state for export_download / dataset_trust. */
  approvalState?:
    | 'none'
    | 'pending'
    | 'explicit_approved'
    | 'revoked'
    | 'expired';
  /** Optional evidence trust state (mirrors EVID2 vocabulary). */
  evidenceTrust?: 'usable' | 'unusable' | 'unknown';
  /** Optional flag indicating whether the model gateway is live. The
   *  contract assumes false unless the caller proves otherwise. */
  modelGatewayLive?: boolean;
  /** Optional flag indicating whether the tool is registered in TOOL2. */
  toolRegistered?: boolean;
  /** Optional flag indicating whether the actor is permitted by TOOL2
   *  metadata for the requested tool. */
  toolActorAllowed?: boolean;
  /** Optional flag indicating whether the agent_handoff was
   *  pre-authorized by AG13 metadata. */
  handoffAuthorized?: boolean;
}

export interface PolicyCheckResult {
  kind: PolicyCheckKind;
  decision: PolicyDecision;
  rationale: string;
  policyBasis: string;
  denyReason?: PolicyDenyReason;
  reviewerRole?: PolicyReviewerRole;
  createdFrom: 'deterministic_runtime_policy_gate_seed';
}

export interface PolicyGateSummary {
  totalChecks: number;
  byDecision: Record<PolicyDecision, number>;
  byKind: Record<PolicyCheckKind, number>;
  denyCount: number;
  waiverCount: number;
  reviewCount: number;
  allowCount: number;
}

// ---------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------

const POLICY_BASIS_PREFIX = 'runtime_policy_gate.v1';

function policyBasisFor(kind: PolicyCheckKind): string {
  return `${POLICY_BASIS_PREFIX}.${kind}`;
}

function nonEmpty(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function freezeResult(result: PolicyCheckResult): PolicyCheckResult {
  return Object.freeze({ ...result });
}

// ---------------------------------------------------------------------
// Per-kind evaluators.
// ---------------------------------------------------------------------

function evaluateTenantScope(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('tenant_scope');
  if (!nonEmpty(req.tenantKey)) {
    return freezeResult({
      kind: 'tenant_scope',
      decision: 'deny',
      rationale:
        'Tenant scope check refused: request tenantKey is empty; every runtime call must be tenant-bound.',
      policyBasis: basis,
      denyReason: 'tenant_scope_mismatch',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (
    nonEmpty(req.subjectTenantKey) &&
    req.subjectTenantKey !== req.tenantKey &&
    req.subjectTenantKey !== 'platform' &&
    req.tenantKey !== 'platform'
  ) {
    return freezeResult({
      kind: 'tenant_scope',
      decision: 'deny',
      rationale: `Tenant scope mismatch: request tenant '${req.tenantKey}' does not match subject tenant '${req.subjectTenantKey}'.`,
      policyBasis: basis,
      denyReason: 'tenant_scope_mismatch',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'tenant_scope',
    decision: 'allow',
    rationale: `Tenant scope check passed for tenantKey '${req.tenantKey}'.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateToolUse(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('tool_use');
  if (req.toolRegistered === false) {
    return freezeResult({
      kind: 'tool_use',
      decision: 'deny',
      rationale: `Tool '${req.subjectId}' is not registered in the TOOL2 registry; refusing dispatch.`,
      policyBasis: basis,
      denyReason: 'tool_not_registered',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (req.toolActorAllowed === false) {
    return freezeResult({
      kind: 'tool_use',
      decision: 'deny',
      rationale: `Actor '${req.actor}' is not permitted to call tool '${req.subjectId}' per TOOL2 allowedAgents metadata.`,
      policyBasis: basis,
      denyReason: 'tool_forbidden_for_actor',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'tool_use',
    decision: 'allow',
    rationale: `Tool '${req.subjectId}' is registered and actor '${req.actor}' is permitted by TOOL2 metadata.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateModelGatewayUse(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('model_gateway_use');
  if (req.modelGatewayLive !== true) {
    return freezeResult({
      kind: 'model_gateway_use',
      decision: 'require_review',
      rationale:
        'Model Gateway is not live (MG2 is contract-only). Routing model calls requires steward review until MG3 lands.',
      policyBasis: basis,
      reviewerRole: 'steward',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'model_gateway_use',
    decision: 'allow',
    rationale: `Model Gateway is live; routing call to '${req.subjectId}' through the gateway.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateEvidenceUse(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('evidence_use');
  if (req.evidenceTrust === 'unusable') {
    return freezeResult({
      kind: 'evidence_use',
      decision: 'deny',
      rationale: `Evidence '${req.subjectId}' is marked unusable in the EVID2 ledger; refusing the cite.`,
      policyBasis: basis,
      denyReason: 'evidence_unusable',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (req.evidenceTrust === 'unknown' || req.evidenceTrust === undefined) {
    return freezeResult({
      kind: 'evidence_use',
      decision: 'require_review',
      rationale: `Evidence '${req.subjectId}' has unknown trust state; steward review required before use.`,
      policyBasis: basis,
      reviewerRole: 'steward',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'evidence_use',
    decision: 'allow',
    rationale: `Evidence '${req.subjectId}' is usable; permitting citation.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateDatasetTrust(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('dataset_trust');
  if (
    req.datasetSharingLevel === 'L4' &&
    req.approvalState !== 'explicit_approved'
  ) {
    return freezeResult({
      kind: 'dataset_trust',
      decision: 'deny',
      rationale: `Dataset '${req.subjectId}' is L4 sensitive and lacks explicit_approved approval; refusing access per TRUST2.`,
      policyBasis: basis,
      denyReason: 'dataset_trust_insufficient',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (req.approvalState === 'revoked' || req.approvalState === 'expired') {
    return freezeResult({
      kind: 'dataset_trust',
      decision: 'deny',
      rationale: `Dataset '${req.subjectId}' approval is ${req.approvalState}; refusing access.`,
      policyBasis: basis,
      denyReason: 'dataset_trust_insufficient',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (req.datasetSharingLevel === 'L3' && req.approvalState !== 'explicit_approved') {
    return freezeResult({
      kind: 'dataset_trust',
      decision: 'require_waiver',
      rationale: `Dataset '${req.subjectId}' is L3 restricted; explicit waiver required from tenant_admin before runtime access.`,
      policyBasis: basis,
      reviewerRole: 'tenant_admin',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'dataset_trust',
    decision: 'allow',
    rationale: `Dataset '${req.subjectId}' sharing level permits runtime access for actor '${req.actor}'.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateExportDownload(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('export_download');
  if (req.approvalState !== 'explicit_approved') {
    return freezeResult({
      kind: 'export_download',
      decision: 'require_waiver',
      rationale: `Export '${req.subjectId}' requires explicit approval before any artifact leaves the tenant boundary; current approvalState='${req.approvalState ?? 'none'}'.`,
      policyBasis: basis,
      denyReason: 'export_requires_approval',
      reviewerRole: 'governance_reviewer',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'export_download',
    decision: 'allow',
    rationale: `Export '${req.subjectId}' carries explicit_approved approval; permitting download.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

function evaluateAgentHandoff(req: PolicyCheckRequest): PolicyCheckResult {
  const basis = policyBasisFor('agent_handoff');
  if (req.handoffAuthorized === false) {
    return freezeResult({
      kind: 'agent_handoff',
      decision: 'deny',
      rationale: `Agent handoff '${req.subjectId}' from actor '${req.actor}' is not authorized by AG13 metadata.`,
      policyBasis: basis,
      denyReason: 'agent_handoff_unauthorized',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  if (req.handoffAuthorized === undefined) {
    return freezeResult({
      kind: 'agent_handoff',
      decision: 'require_review',
      rationale: `Agent handoff '${req.subjectId}' authorization unknown; steward review required.`,
      policyBasis: basis,
      reviewerRole: 'steward',
      createdFrom: 'deterministic_runtime_policy_gate_seed',
    });
  }
  return freezeResult({
    kind: 'agent_handoff',
    decision: 'allow',
    rationale: `Agent handoff '${req.subjectId}' authorized for actor '${req.actor}'.`,
    policyBasis: basis,
    createdFrom: 'deterministic_runtime_policy_gate_seed',
  });
}

// ---------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------

export function evaluatePolicyCheck(
  request: PolicyCheckRequest,
): PolicyCheckResult {
  switch (request.kind) {
    case 'tenant_scope':
      return evaluateTenantScope(request);
    case 'tool_use':
      return evaluateToolUse(request);
    case 'model_gateway_use':
      return evaluateModelGatewayUse(request);
    case 'evidence_use':
      return evaluateEvidenceUse(request);
    case 'dataset_trust':
      return evaluateDatasetTrust(request);
    case 'export_download':
      return evaluateExportDownload(request);
    case 'agent_handoff':
      return evaluateAgentHandoff(request);
    default: {
      const exhaustive: never = request.kind;
      return freezeResult({
        kind: exhaustive,
        decision: 'deny',
        rationale: `Unknown policy check kind '${String(exhaustive)}'.`,
        policyBasis: `${POLICY_BASIS_PREFIX}.unknown`,
        denyReason: 'governance_constraint_violated',
        createdFrom: 'deterministic_runtime_policy_gate_seed',
      });
    }
  }
}

function emptyDecisionCounter(): Record<PolicyDecision, number> {
  return {
    allow: 0,
    deny: 0,
    require_waiver: 0,
    require_review: 0,
  };
}

function emptyKindCounter(): Record<PolicyCheckKind, number> {
  return {
    tenant_scope: 0,
    tool_use: 0,
    model_gateway_use: 0,
    evidence_use: 0,
    dataset_trust: 0,
    export_download: 0,
    agent_handoff: 0,
  };
}

export function summarizePolicyChecks(
  results: readonly PolicyCheckResult[],
): PolicyGateSummary {
  const byDecision = emptyDecisionCounter();
  const byKind = emptyKindCounter();

  let denyCount = 0;
  let waiverCount = 0;
  let reviewCount = 0;
  let allowCount = 0;

  for (const result of results) {
    byDecision[result.decision] += 1;
    byKind[result.kind] += 1;
    if (result.decision === 'deny') denyCount += 1;
    if (result.decision === 'require_waiver') waiverCount += 1;
    if (result.decision === 'require_review') reviewCount += 1;
    if (result.decision === 'allow') allowCount += 1;
  }

  return {
    totalChecks: results.length,
    byDecision,
    byKind,
    denyCount,
    waiverCount,
    reviewCount,
    allowCount,
  };
}

export function getDenyReasons(
  results: readonly PolicyCheckResult[],
): readonly PolicyDenyReason[] {
  const reasons: PolicyDenyReason[] = [];
  for (const result of results) {
    if (result.decision === 'deny' && result.denyReason !== undefined) {
      reasons.push(result.denyReason);
    }
  }
  return reasons;
}

// ---------------------------------------------------------------------
// Internal exports for tests (kept narrow).
// ---------------------------------------------------------------------

export const __SEC1_INTERNALS__ = {
  POLICY_BASIS_PREFIX,
  policyBasisFor,
};
