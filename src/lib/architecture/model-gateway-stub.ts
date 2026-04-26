// MG2 - Model Gateway Stub.
//
// Pure deterministic stub for the Model Gateway chokepoint described
// in ARCH1 section 6 ("the single chokepoint for every model call").
// MG2 names the request / response / audit / refusal contract types
// and exposes a routing function that NEVER invokes a live provider:
// every well-formed request returns `decision: 'dry_run'`, every
// invalid request returns `decision: 'block'` with a typed reason.
//
// This is intentional. Live model invocation is deferred to a future
// runtime slice. The MG1 contract (architecture-level, may not yet
// exist as a standalone slice doc on this worktree) names the live
// behavior plan; the inline summary below carries forward the parts
// MG2 must respect:
//
//   1. Single chokepoint - no other module may import openai /
//      anthropic / @anthropic-ai/sdk; the gateway is the only place
//      a provider SDK is allowed (currently: nowhere, since live
//      invocation is unwired).
//   2. Provider-agnostic prompt assembly - the gateway speaks in
//      typed routes (modelName + tier + fallbackChain), not raw
//      provider strings.
//   3. Audit-by-default - every call (including stub dry_run / block
//      decisions) emits a fully populated audit record.
//   4. Refusal contract - typed reasons, named in audit, surfaceable
//      to the canvas as a missing-input chip.
//   5. Tenant scope - every request is scoped to a tenantKey; an
//      empty tenantKey is a hard block.
//
// MG2 explicitly DOES NOT:
//   - import any provider SDK (no openai, no anthropic).
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/atlas/, src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ModelGatewayDecision =
  | 'allow'
  | 'block'
  | 'defer'
  | 'dry_run'
  | 'route_to_fallback';

export type ModelGatewayBlockedReason =
  | 'live_gateway_not_implemented'
  | 'context_pack_missing'
  | 'evidence_unusable'
  | 'governance_constraint_violation'
  | 'tenant_scope_invalid'
  | 'redaction_required_but_not_supported'
  | 'cost_budget_exceeded'
  | 'model_tier_unavailable';

export type ModelGatewayTier =
  | 'tier_a_premium'
  | 'tier_b_balanced'
  | 'tier_c_economy'
  | 'tier_d_local_only';

export type ModelGatewayPolicy =
  | 'no_pii'
  | 'no_secrets'
  | 'no_evidence_metadata_leak'
  | 'tenant_isolation'
  | 'audit_required';

export type ModelGatewayAgentKey =
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'steward';

export interface ModelGatewayRequest {
  tenantKey: string;
  agentKey: ModelGatewayAgentKey;
  intent: string;
  contextPackRef: string; // CTX1 / CTX2 result id
  modelTier: ModelGatewayTier;
  policies: readonly ModelGatewayPolicy[];
  costBudgetCents: number;
  redactionRequested: boolean;
}

export interface ModelGatewayRoute {
  // Canonical name only - never a real provider model id.
  // The live gateway will translate canonical names into provider
  // model ids inside the gateway module; the stub stops short.
  modelName: string;
  tier: ModelGatewayTier;
  fallbackChain: readonly string[];
}

export interface ModelGatewayAuditRecord {
  requestId: string; // deterministic seed id "mgw-stub-{tenantKey}-{agentKey}-{hash}"
  tenantKey: string;
  agentKey: string;
  decision: ModelGatewayDecision;
  reason?: ModelGatewayBlockedReason;
  policiesApplied: readonly ModelGatewayPolicy[];
  modelName?: string;
  estimatedCostCents: number;
  trace: { gatewayVersion: string; promptHashSeed: string };
}

export interface ModelGatewayResponse {
  decision: ModelGatewayDecision;
  reason?: ModelGatewayBlockedReason;
  route?: ModelGatewayRoute;
  audit: ModelGatewayAuditRecord;
  // Always present. Names the stub-only nature explicitly so a
  // surface that reads this response cannot pretend a live call
  // happened.
  honestNote: string;
}

// ---------------------------------------------------------------------
// Public constants
// ---------------------------------------------------------------------

// String tokens documenting the gateway's anti-patterns. Stored in
// a string-array literal so a hygiene scanner that strips string
// literals before searching for forbidden tokens (e.g.
// "import_openai_outside_gateway") will not flag this file.
export const MODEL_GATEWAY_FORBIDDEN_PATTERNS = [
  'import_openai_outside_gateway',
  'import_anthropic_outside_gateway',
  'page_level_provider_call',
  'agent_direct_provider_call',
  'unaudited_model_call',
] as const;

export type ModelGatewayForbiddenPattern =
  (typeof MODEL_GATEWAY_FORBIDDEN_PATTERNS)[number];

const GATEWAY_VERSION = 'mg2.stub.v1';

const CANONICAL_AGENT_KEYS: ReadonlyArray<ModelGatewayAgentKey> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

const CANONICAL_TIERS: ReadonlyArray<ModelGatewayTier> = [
  'tier_a_premium',
  'tier_b_balanced',
  'tier_c_economy',
  'tier_d_local_only',
];

// Hardcoded per-tier cost lookup (cents per call). Deterministic;
// the real gateway will compute cost from token counts and a
// provider price table. The stub uses a fixed table to keep audit
// records stable across calls.
const TIER_BASE_COST_CENTS: Record<ModelGatewayTier, number> = {
  tier_a_premium: 24,
  tier_b_balanced: 8,
  tier_c_economy: 2,
  tier_d_local_only: 0,
};

// Canonical model name per tier. These are NOT provider model ids;
// they are gateway-internal canonical names. The live gateway will
// translate canonical names into provider model ids inside the
// gateway boundary.
const TIER_CANONICAL_MODEL_NAME: Record<ModelGatewayTier, string> = {
  tier_a_premium: 'canonical_premium_compose_v1',
  tier_b_balanced: 'canonical_balanced_compose_v1',
  tier_c_economy: 'canonical_economy_compose_v1',
  tier_d_local_only: 'canonical_local_rerank_v1',
};

// Deterministic fallback chain per tier (canonical names only).
const TIER_FALLBACK_CHAIN: Record<ModelGatewayTier, ReadonlyArray<string>> = {
  tier_a_premium: [
    'canonical_balanced_compose_v1',
    'canonical_economy_compose_v1',
  ],
  tier_b_balanced: ['canonical_economy_compose_v1'],
  tier_c_economy: ['canonical_local_rerank_v1'],
  tier_d_local_only: [],
};

const HONEST_NOTE_TEMPLATE =
  'Live gateway not implemented; this stub returns dry_run or block ' +
  'only and references the MG1 model gateway contract for the live ' +
  'behavior plan.';

// ---------------------------------------------------------------------
// Internal helpers (deterministic, no SDK / crypto / Date / random)
// ---------------------------------------------------------------------

// Deterministic 32-bit string hash, converted to lowercase hex and
// truncated to 12 chars. NOT a cryptographic hash; the live gateway
// will use a real prompt hash. The stub only needs determinism.
function deterministicHashHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    // (h<<5) - h is the classic djb2 hash multiply trick.
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  // Convert to unsigned and to hex; left-pad to 8 chars; double up
  // to reach 12 chars deterministically (no random padding).
  const unsigned = (h >>> 0).toString(16).padStart(8, '0');
  // Mix in the length to add a second component without random.
  const lenComponent = (input.length & 0xffff)
    .toString(16)
    .padStart(4, '0');
  return (unsigned + lenComponent).slice(0, 12);
}

function isAgentKey(value: string): value is ModelGatewayAgentKey {
  return CANONICAL_AGENT_KEYS.includes(value as ModelGatewayAgentKey);
}

function isTier(value: string): value is ModelGatewayTier {
  return CANONICAL_TIERS.includes(value as ModelGatewayTier);
}

function dedupePoliciesSorted(
  policies: ReadonlyArray<ModelGatewayPolicy>,
): ReadonlyArray<ModelGatewayPolicy> {
  const seen = new Set<ModelGatewayPolicy>();
  for (const p of policies) {
    seen.add(p);
  }
  return Array.from(seen).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildRequestId(
  tenantKey: string,
  agentKey: string,
  intent: string,
): string {
  // intent may be empty (block path); the hash is still deterministic.
  const hash = deterministicHashHex(intent).slice(0, 12);
  const safeTenant = tenantKey.length > 0 ? tenantKey : 'unscoped';
  const safeAgent = agentKey.length > 0 ? agentKey : 'unknown';
  return 'mgw-stub-' + safeTenant + '-' + safeAgent + '-' + hash;
}

function estimateCostCents(
  tier: ModelGatewayTier,
  intent: string,
): number {
  const base = TIER_BASE_COST_CENTS[tier];
  // Length seed is deterministic and bounded so the audit value is
  // stable per (tier x intent length).
  const lengthSeed = intent.length & 0xff;
  return base + lengthSeed;
}

function buildAudit(args: {
  request: ModelGatewayRequest;
  decision: ModelGatewayDecision;
  reason?: ModelGatewayBlockedReason;
  modelName?: string;
}): ModelGatewayAuditRecord {
  const { request, decision, reason, modelName } = args;
  const policiesApplied = dedupePoliciesSorted(request.policies);
  const promptHashSeed = deterministicHashHex(
    request.tenantKey +
      '|' +
      request.agentKey +
      '|' +
      request.contextPackRef +
      '|' +
      request.intent,
  );
  const audit: ModelGatewayAuditRecord = {
    requestId: buildRequestId(
      request.tenantKey,
      request.agentKey,
      request.intent,
    ),
    tenantKey: request.tenantKey,
    agentKey: request.agentKey,
    decision,
    policiesApplied,
    estimatedCostCents: estimateCostCents(request.modelTier, request.intent),
    trace: {
      gatewayVersion: GATEWAY_VERSION,
      promptHashSeed,
    },
  };
  if (reason !== undefined) {
    audit.reason = reason;
  }
  if (modelName !== undefined) {
    audit.modelName = modelName;
  }
  return audit;
}

function buildBlockResponse(
  request: ModelGatewayRequest,
  reason: ModelGatewayBlockedReason,
): ModelGatewayResponse {
  return {
    decision: 'block',
    reason,
    audit: buildAudit({ request, decision: 'block', reason }),
    honestNote: HONEST_NOTE_TEMPLATE,
  };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export function createModelGatewayRequest(
  input: Partial<ModelGatewayRequest> &
    Pick<
      ModelGatewayRequest,
      'tenantKey' | 'agentKey' | 'intent' | 'contextPackRef'
    >,
): ModelGatewayRequest {
  const tier: ModelGatewayTier = isTier(input.modelTier ?? '')
    ? (input.modelTier as ModelGatewayTier)
    : 'tier_b_balanced';
  const policies = dedupePoliciesSorted(input.policies ?? []);
  const costBudgetCents =
    typeof input.costBudgetCents === 'number' &&
    Number.isFinite(input.costBudgetCents) &&
    input.costBudgetCents >= 0
      ? Math.floor(input.costBudgetCents)
      : 0;
  const redactionRequested = input.redactionRequested === true;
  return {
    tenantKey: input.tenantKey,
    agentKey: input.agentKey,
    intent: input.intent,
    contextPackRef: input.contextPackRef,
    modelTier: tier,
    policies,
    costBudgetCents,
    redactionRequested,
  };
}

export function blockModelGatewayRequest(
  request: ModelGatewayRequest,
  reason: ModelGatewayBlockedReason,
): ModelGatewayResponse {
  return buildBlockResponse(request, reason);
}

export function routeModelGatewayRequest(
  request: ModelGatewayRequest,
): ModelGatewayResponse {
  // Validation gates - return typed block responses for malformed
  // requests. Order is deliberate: tenant scope first, then agent,
  // then intent, then context pack ref, then redaction support, then
  // tier availability, then cost budget.
  if (typeof request.tenantKey !== 'string' || request.tenantKey.length === 0) {
    return buildBlockResponse(request, 'tenant_scope_invalid');
  }
  if (
    typeof request.agentKey !== 'string' ||
    !isAgentKey(request.agentKey)
  ) {
    return buildBlockResponse(request, 'tenant_scope_invalid');
  }
  if (typeof request.intent !== 'string' || request.intent.length === 0) {
    return buildBlockResponse(request, 'context_pack_missing');
  }
  if (
    typeof request.contextPackRef !== 'string' ||
    request.contextPackRef.length === 0
  ) {
    return buildBlockResponse(request, 'context_pack_missing');
  }
  if (request.redactionRequested === true) {
    // The stub has no redaction pipeline. Live gateway will plug in
    // a typed redactor; until then we honestly refuse.
    return buildBlockResponse(
      request,
      'redaction_required_but_not_supported',
    );
  }
  if (!isTier(request.modelTier)) {
    return buildBlockResponse(request, 'model_tier_unavailable');
  }
  const estimated = estimateCostCents(request.modelTier, request.intent);
  if (
    typeof request.costBudgetCents === 'number' &&
    request.costBudgetCents > 0 &&
    estimated > request.costBudgetCents
  ) {
    return buildBlockResponse(request, 'cost_budget_exceeded');
  }

  // Well-formed request. The live gateway would now compose a
  // provider-agnostic prompt and dispatch to a provider; the stub
  // stops here and returns a fully audited dry_run.
  const route: ModelGatewayRoute = {
    modelName: TIER_CANONICAL_MODEL_NAME[request.modelTier],
    tier: request.modelTier,
    fallbackChain: TIER_FALLBACK_CHAIN[request.modelTier],
  };
  return {
    decision: 'dry_run',
    route,
    audit: buildAudit({
      request,
      decision: 'dry_run',
      modelName: route.modelName,
    }),
    honestNote: HONEST_NOTE_TEMPLATE,
  };
}

export function summarizeModelGatewayDecision(
  response: ModelGatewayResponse,
): string {
  const reasonSegment =
    response.reason !== undefined ? ' (' + response.reason + ')' : '';
  const modelSegment =
    response.route !== undefined
      ? ' via ' + response.route.modelName
      : '';
  return (
    'mg2:' +
    response.audit.tenantKey +
    ':' +
    response.audit.agentKey +
    ' -> ' +
    response.decision +
    reasonSegment +
    modelSegment +
    ' [audit ' +
    response.audit.requestId +
    ']'
  );
}
