// MG3 - Model Gateway Safe Integration Contract.
//
// Pure type-only contract module describing the safety boundary for
// the eventual live Model Gateway runtime. MG3 ships ZERO runtime
// behavior - no provider SDK, no fetch, no Date, no randomness, no
// agent / source / sentinel / atlas / auth imports, no UI. The
// contract names the callers, request classifications, model tiers,
// redaction policies, audit requirements, cost caps, fallback chain,
// and forbidden patterns that the live gateway must enforce.
//
// Relationship to prior gateway slices:
//
//   - MG1 (architecture-level contract, ARCH1 section 6 "the single
//     chokepoint for every model call") names the live behavior plan.
//   - MG2 (src/lib/architecture/model-gateway-stub.ts, landed in #253)
//     is a deterministic stub that returns dry_run / block only and
//     never calls a provider; the stub is the runtime placeholder
//     while the gateway is unwired.
//   - MG3 (this module) is the integration contract: it specifies
//     WHAT the live gateway must enforce (callers, classifications,
//     tiers, redaction, audit, cost, fallback, forbidden patterns)
//     without specifying HOW. The live runtime is still deferred.
//
// MG3 explicitly DOES NOT:
//   - import any provider SDK (no openai, no anthropic, no
//     @anthropic-ai/sdk, no @openai/sdk).
//   - call fetch, Date.now, Math.random, or new Date(.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/atlas/, src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.
//   - mutate any state. Every export is a const literal or a pure
//     accessor over the const literals.
//
// The GATEWAY_FORBIDDEN_PATTERNS array names the SDK anti-patterns
// for downstream lint / CI scanners. Those strings appear ONLY inside
// a string-array literal so a hygiene scanner that strips string
// literals before searching for forbidden tokens (e.g.
// "agent_direct_provider_call") will not flag this file.

// ---------------------------------------------------------------------
// Caller kinds
// ---------------------------------------------------------------------

export const GATEWAY_CALLER_KINDS = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
  'system',
  'admin',
] as const;
export type GatewayCaller = (typeof GATEWAY_CALLER_KINDS)[number];

// ---------------------------------------------------------------------
// Request classifications
// ---------------------------------------------------------------------

export const GATEWAY_REQUEST_CLASSIFICATIONS = [
  'recommendation',
  'synthesis',
  'classification',
  'extraction',
  'evidence_check',
  'audit',
  'evaluation',
] as const;
export type GatewayRequestClassification =
  (typeof GATEWAY_REQUEST_CLASSIFICATIONS)[number];

// ---------------------------------------------------------------------
// Model tiers
// ---------------------------------------------------------------------

export const GATEWAY_MODEL_TIERS = [
  'tier_a_premium',
  'tier_b_balanced',
  'tier_c_economy',
  'tier_d_local_only',
] as const;
export type GatewayModelTier = (typeof GATEWAY_MODEL_TIERS)[number];

// ---------------------------------------------------------------------
// Routing and safety decision unions (kept in sync with MG2)
// ---------------------------------------------------------------------

export type GatewayRoutingDecision =
  | 'allow'
  | 'block'
  | 'defer'
  | 'route_to_fallback'
  | 'dry_run';

export type GatewaySafetyDecision =
  | 'safe'
  | 'block_pii'
  | 'block_secrets'
  | 'block_evidence_leak'
  | 'redact_required'
  | 'tenant_violation';

// ---------------------------------------------------------------------
// Cost / audit / fallback policy shapes
// ---------------------------------------------------------------------

export interface GatewayCostPolicy {
  perRequestBudgetCentsCap: number;
  perTenantDailyBudgetCentsCap: number;
  perAgentBudgetCentsCap: number;
  costEstimateRequired: boolean;
  costAuditRequired: boolean;
}

export interface GatewayAuditRequirement {
  requirementKey: string;
  appliesTo: readonly GatewayRequestClassification[];
  description: string;
  blocking: boolean;
}

export interface GatewayFallbackPolicy {
  enableFallback: boolean;
  fallbackChainTiers: readonly GatewayModelTier[];
  blockedReasonsThatTriggerFallback: readonly string[];
}

// ---------------------------------------------------------------------
// Top-level integration policy
// ---------------------------------------------------------------------

export interface GatewayIntegrationPolicy {
  policyId: string;
  callersAllowed: readonly GatewayCaller[];
  callersForbidden: readonly string[];
  requestClassificationsAllowed: readonly GatewayRequestClassification[];
  modelTiersAllowed: readonly GatewayModelTier[];
  redactionPoliciesRequired: readonly (
    | 'redact_pii'
    | 'redact_secrets'
    | 'redact_evidence_metadata'
    | 'redact_tenant_isolation'
  )[];
  auditRequirements: readonly GatewayAuditRequirement[];
  costPolicy: GatewayCostPolicy;
  fallbackPolicy: GatewayFallbackPolicy;
  liveExecution: false;
  notes: readonly string[];
}

// ---------------------------------------------------------------------
// Per-classification metadata
// ---------------------------------------------------------------------

export interface GatewayRequestClassificationMetadata {
  key: GatewayRequestClassification;
  description: string;
  defaultTier: GatewayModelTier;
  redactionRequired: boolean;
  auditRequired: boolean;
}

// ---------------------------------------------------------------------
// Per-caller metadata
// ---------------------------------------------------------------------

export interface GatewayCallerMetadata {
  caller: GatewayCaller;
  description: string;
  allowedClassifications: readonly GatewayRequestClassification[];
  defaultTier: GatewayModelTier;
  enforcementNotes: readonly string[];
}

// ---------------------------------------------------------------------
// Forbidden integration patterns
// ---------------------------------------------------------------------

// Named anti-patterns the live gateway and CI scanners must reject.
// These strings only appear inside this string-array literal; the
// module itself imports no SDK and references no provider name in
// real code.
export const GATEWAY_FORBIDDEN_PATTERNS = [
  'agent_direct_provider_call',
  'page_direct_provider_call',
  'unaudited_model_call',
  'sdk_import_outside_gateway',
  'fetch_to_provider_endpoint',
  'env_secret_exposed_to_browser',
  'unredacted_pii_to_provider',
  'cross_tenant_request',
] as const;
export type GatewayForbiddenPattern =
  (typeof GATEWAY_FORBIDDEN_PATTERNS)[number];

// ---------------------------------------------------------------------
// Canonical metadata tables
// ---------------------------------------------------------------------

export const GATEWAY_REQUEST_CLASSIFICATION_METADATA: Record<
  GatewayRequestClassification,
  GatewayRequestClassificationMetadata
> = {
  recommendation: {
    key: 'recommendation',
    description:
      'Composes a recommendation for an agent or operator surface; ' +
      'rationale must be carried in the audit record and a typed ' +
      'evidence basis must be cited or the request is refused.',
    defaultTier: 'tier_a_premium',
    redactionRequired: true,
    auditRequired: true,
  },
  synthesis: {
    key: 'synthesis',
    description:
      'Synthesizes a multi-source brief from typed context packs; ' +
      'no source contents may leave tenant scope and the response ' +
      'must declare which sources contributed.',
    defaultTier: 'tier_b_balanced',
    redactionRequired: true,
    auditRequired: true,
  },
  classification: {
    key: 'classification',
    description:
      'Assigns a typed label drawn from a closed vocabulary; ' +
      'rejects free-form output. Default tier is balanced because ' +
      'the closed vocabulary keeps the call cheap.',
    defaultTier: 'tier_b_balanced',
    redactionRequired: false,
    auditRequired: true,
  },
  extraction: {
    key: 'extraction',
    description:
      'Pulls typed fields from a context pack; output schema is ' +
      'fixed; tenant isolation is enforced and PII fields are ' +
      'redacted before the call leaves the gateway.',
    defaultTier: 'tier_b_balanced',
    redactionRequired: true,
    auditRequired: true,
  },
  evidence_check: {
    key: 'evidence_check',
    description:
      'Verifies that a claim is supported by the supplied evidence ' +
      'set; the live gateway must refuse the call when the evidence ' +
      'basis is missing or weak rather than fabricate support.',
    defaultTier: 'tier_a_premium',
    redactionRequired: true,
    auditRequired: true,
  },
  audit: {
    key: 'audit',
    description:
      'Reviews a prior gateway response or agent action for policy ' +
      'compliance; the audit classification is itself audited so ' +
      'the audit chain is reconstructable.',
    defaultTier: 'tier_c_economy',
    redactionRequired: false,
    auditRequired: true,
  },
  evaluation: {
    key: 'evaluation',
    description:
      'Scores a fixed test fixture against a rubric; the local-only ' +
      'tier is reserved for evaluation runs that must never leave ' +
      'tenant or process boundary.',
    defaultTier: 'tier_d_local_only',
    redactionRequired: true,
    auditRequired: true,
  },
};

export const GATEWAY_CALLER_METADATA: Record<
  GatewayCaller,
  GatewayCallerMetadata
> = {
  nexus: {
    caller: 'nexus',
    description:
      'Founder-facing program intelligence agent. Composes briefs, ' +
      'recommendations, and synthesis responses through the gateway ' +
      'only; never imports a provider SDK directly.',
    allowedClassifications: [
      'recommendation',
      'synthesis',
      'classification',
      'extraction',
      'evidence_check',
    ],
    defaultTier: 'tier_a_premium',
    enforcementNotes: [
      'All calls must include a CTX2 context pack reference.',
      'Recommendations require a non-empty evidence basis or are refused.',
    ],
  },
  sentinel: {
    caller: 'sentinel',
    description:
      'Pattern-detection agent. Issues classification and extraction ' +
      'calls against tenant signal streams; never reads cross-tenant ' +
      'data; emits an audit record for every classification.',
    allowedClassifications: [
      'classification',
      'extraction',
      'evidence_check',
      'evaluation',
    ],
    defaultTier: 'tier_b_balanced',
    enforcementNotes: [
      'Tenant isolation is asserted on every request.',
      'Classification calls must draw from a closed vocabulary.',
    ],
  },
  atlas: {
    caller: 'atlas',
    description:
      'Executive-fidelity synthesis agent. Issues synthesis and ' +
      'recommendation calls scoped to a single tenant; never holds ' +
      'a provider key directly; always routes through the gateway.',
    allowedClassifications: [
      'synthesis',
      'recommendation',
      'extraction',
      'evidence_check',
    ],
    defaultTier: 'tier_a_premium',
    enforcementNotes: [
      'Synthesis output must declare contributing sources.',
      'Cross-tenant references are a hard refusal.',
    ],
  },
  steward: {
    caller: 'steward',
    description:
      'Ops / governance agent. Issues audit and evaluation calls ' +
      'against gateway responses; reads the audit ledger; never ' +
      'forwards prompts to a provider outside the gateway.',
    allowedClassifications: [
      'audit',
      'evaluation',
      'classification',
      'evidence_check',
    ],
    defaultTier: 'tier_c_economy',
    enforcementNotes: [
      'Audit calls are themselves audited.',
      'Evaluation calls default to the local-only tier.',
    ],
  },
  system: {
    caller: 'system',
    description:
      'Internal scheduled job or background worker (e.g. the ' +
      'unified context builder rebuild, the readiness recompute). ' +
      'Issues low-risk audit and extraction calls through the ' +
      'gateway under a service tenant scope.',
    allowedClassifications: ['audit', 'extraction', 'evaluation'],
    defaultTier: 'tier_c_economy',
    enforcementNotes: [
      'System callers must declare a service tenant scope.',
      'No interactive recommendation or synthesis calls.',
    ],
  },
  admin: {
    caller: 'admin',
    description:
      'Founder / operator control-plane caller. Issues audit and ' +
      'evaluation calls only; the admin caller is the only path that ' +
      'may inspect cross-classification audit chains.',
    allowedClassifications: ['audit', 'evaluation'],
    defaultTier: 'tier_c_economy',
    enforcementNotes: [
      'Admin calls require a typed control-plane reason.',
      'Admin never bypasses redaction or audit.',
    ],
  },
};

// ---------------------------------------------------------------------
// Audit requirements (>= 5 per spec)
// ---------------------------------------------------------------------

const AUDIT_REQUIREMENTS: readonly GatewayAuditRequirement[] = [
  {
    requirementKey: 'every_request_audited',
    appliesTo: GATEWAY_REQUEST_CLASSIFICATIONS,
    description:
      'Every gateway request emits a fully populated audit record ' +
      'regardless of decision (allow / block / defer / dry_run / ' +
      'route_to_fallback). An unaudited call is a forbidden pattern.',
    blocking: true,
  },
  {
    requirementKey: 'evidence_check_requires_evidence_basis',
    appliesTo: ['evidence_check'],
    description:
      'Every evidence_check call must cite a non-empty evidence ' +
      'basis; missing or weak evidence is a hard refusal rather ' +
      'than a fabricated allow.',
    blocking: true,
  },
  {
    requirementKey: 'recommendation_requires_rationale',
    appliesTo: ['recommendation'],
    description:
      'Every recommendation call must record a rationale segment ' +
      'in the audit record; the surface that consumes the ' +
      'recommendation can render or strip it but cannot ignore it.',
    blocking: true,
  },
  {
    requirementKey: 'write_classifications_require_approval',
    appliesTo: ['recommendation', 'synthesis'],
    description:
      'Classifications that produce write-shaped output (a brief, ' +
      'a recommendation card, a synthesized artifact) require an ' +
      'approval token from the calling agent; the gateway refuses ' +
      'unapproved write-shaped requests.',
    blocking: true,
  },
  {
    requirementKey: 'model_selection_traced',
    appliesTo: GATEWAY_REQUEST_CLASSIFICATIONS,
    description:
      'Every audit record names the canonical model selected, the ' +
      'tier, and the fallback chain considered. Model selection ' +
      'must be reconstructable from the audit alone.',
    blocking: true,
  },
  {
    requirementKey: 'tenant_scope_recorded',
    appliesTo: GATEWAY_REQUEST_CLASSIFICATIONS,
    description:
      'Every audit record carries the tenantKey and the caller ' +
      'identity. Cross-tenant requests are a forbidden pattern; ' +
      'the gateway refuses them at the boundary.',
    blocking: true,
  },
  {
    requirementKey: 'cost_estimate_recorded',
    appliesTo: GATEWAY_REQUEST_CLASSIFICATIONS,
    description:
      'Every audit record carries an estimatedCostCents value ' +
      'computed before the call and a costAuditRequired flag. The ' +
      'live gateway reconciles the post-call actual against the ' +
      'estimate in a follow-up audit entry.',
    blocking: false,
  },
];

// ---------------------------------------------------------------------
// Cost policy (hardcoded conservative defaults)
// ---------------------------------------------------------------------

const COST_POLICY: GatewayCostPolicy = {
  perRequestBudgetCentsCap: 50,
  perTenantDailyBudgetCentsCap: 5000,
  perAgentBudgetCentsCap: 1500,
  costEstimateRequired: true,
  costAuditRequired: true,
};

// ---------------------------------------------------------------------
// Fallback policy (the standard tier_a -> tier_b -> tier_c -> tier_d
// chain, triggered by named blocked reasons that should downgrade
// rather than refuse)
// ---------------------------------------------------------------------

const FALLBACK_POLICY: GatewayFallbackPolicy = {
  enableFallback: true,
  fallbackChainTiers: [
    'tier_a_premium',
    'tier_b_balanced',
    'tier_c_economy',
    'tier_d_local_only',
  ],
  blockedReasonsThatTriggerFallback: [
    'model_tier_unavailable',
    'cost_budget_exceeded',
    'provider_transient_error',
    'live_gateway_not_implemented',
  ],
};

// ---------------------------------------------------------------------
// Canonical integration policy
// ---------------------------------------------------------------------

export const GATEWAY_INTEGRATION_POLICY: GatewayIntegrationPolicy = {
  policyId: 'gateway.integration.v1',
  callersAllowed: GATEWAY_CALLER_KINDS,
  callersForbidden: [
    'page_component',
    'agent_direct_provider_call',
    'browser_runtime_with_secret',
    'cross_tenant_caller',
    'unaudited_caller',
    'sdk_import_outside_gateway',
  ],
  requestClassificationsAllowed: GATEWAY_REQUEST_CLASSIFICATIONS,
  modelTiersAllowed: GATEWAY_MODEL_TIERS,
  redactionPoliciesRequired: [
    'redact_pii',
    'redact_secrets',
    'redact_evidence_metadata',
    'redact_tenant_isolation',
  ],
  auditRequirements: AUDIT_REQUIREMENTS,
  costPolicy: COST_POLICY,
  fallbackPolicy: FALLBACK_POLICY,
  liveExecution: false,
  notes: [
    'MG3 is a contract-only slice. The live gateway runtime is ' +
      'still deferred; MG2 ships the deterministic stub used by ' +
      'every caller until then.',
    'tier_d_local_only is reserved for cases where redaction is ' +
      'required but the redaction pipeline is not ready; the live ' +
      'gateway routes such calls to local-only or refuses.',
    'callersForbidden names integration shapes the gateway must ' +
      'reject at the boundary - page-level provider calls, agent ' +
      'direct provider calls, browser-side secret holders, and any ' +
      'SDK import outside the gateway module.',
  ],
};

// ---------------------------------------------------------------------
// Pure accessors
// ---------------------------------------------------------------------

export function getGatewayCallerMetadata(
  caller: string,
): GatewayCallerMetadata | null {
  if (typeof caller !== 'string' || caller.length === 0) {
    return null;
  }
  if (!GATEWAY_CALLER_KINDS.includes(caller as GatewayCaller)) {
    return null;
  }
  return GATEWAY_CALLER_METADATA[caller as GatewayCaller];
}

export function getGatewayClassificationMetadata(
  kind: string,
): GatewayRequestClassificationMetadata | null {
  if (typeof kind !== 'string' || kind.length === 0) {
    return null;
  }
  if (
    !GATEWAY_REQUEST_CLASSIFICATIONS.includes(
      kind as GatewayRequestClassification,
    )
  ) {
    return null;
  }
  return GATEWAY_REQUEST_CLASSIFICATION_METADATA[
    kind as GatewayRequestClassification
  ];
}

export function summarizeGatewayIntegrationPolicy(): {
  totalCallers: number;
  totalClassifications: number;
  totalTiers: number;
  auditRequirementsCount: number;
  forbiddenPatternsCount: number;
} {
  return {
    totalCallers: GATEWAY_INTEGRATION_POLICY.callersAllowed.length,
    totalClassifications:
      GATEWAY_INTEGRATION_POLICY.requestClassificationsAllowed.length,
    totalTiers: GATEWAY_INTEGRATION_POLICY.modelTiersAllowed.length,
    auditRequirementsCount:
      GATEWAY_INTEGRATION_POLICY.auditRequirements.length,
    forbiddenPatternsCount: GATEWAY_FORBIDDEN_PATTERNS.length,
  };
}
