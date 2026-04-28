// model-gateway-live-provider-stub.ts — MG3
//
// Simulates a live-provider invocation for a routed ModelGatewayRequest.
// Accepts the route decision from MG2 (model-gateway-stub.ts) and the
// original request; returns a deterministic fake completion record that
// mirrors what a real provider SDK would return — without actually
// calling any provider.
//
// Intent: MG2 decides *which* canonical model to use; MG3 decides
// *what that live call would return*. Together they form a complete
// stub pipeline: validate → route (MG2) → invoke (MG3) → surface.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors model-gateway-stub.ts module structure.
//
// This module explicitly DOES NOT:
//   - import openai, anthropic, or @anthropic-ai/sdk.
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/auth/, supabase, etc.
//   - render any UI or invoke any agent runtime.

import {
  type ModelGatewayRequest,
  type ModelGatewayRoute,
  type ModelGatewayBlockedReason,
  type ModelGatewayPolicy,
} from './model-gateway-stub';

// ─── Decision types ───────────────────────────────────────────────────────────

export type LiveProviderDecision = 'stubbed_live' | 'block';

// Canonical (fake) provider names. The live gateway will swap these
// for real provider SDK references inside the gateway boundary.
export type LiveProviderName =
  | 'provider-alpha'
  | 'provider-beta'
  | 'provider-gamma'
  | 'provider-local';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface LiveProviderStubRequest {
  /** Original validated gateway request (from MG2). */
  gatewayRequest: ModelGatewayRequest;
  /** Resolved route from MG2's routeModelGatewayRequest. */
  route: ModelGatewayRoute;
}

export interface LiveProviderTokenCounts {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LiveProviderStubAuditRecord {
  /** Deterministic seed id: "mg3-live-{tenantKey}-{agentKey}-{hash}" */
  invocationId: string;
  tenantKey: string;
  agentKey: string;
  decision: LiveProviderDecision;
  reason?: ModelGatewayBlockedReason;
  providerName: LiveProviderName | 'unknown';
  modelNameResolved: string;
  tokenCounts: LiveProviderTokenCounts;
  /** Deterministic stub latency in milliseconds (no real network call). */
  stubLatencyMs: number;
  policiesEnforced: readonly ModelGatewayPolicy[];
  trace: {
    gatewayVersion: string;
    routeHashSeed: string;
  };
}

export interface LiveProviderStubResponse {
  decision: LiveProviderDecision;
  reason?: ModelGatewayBlockedReason;
  /** Deterministic fake completion text — never a real model output. */
  completionText?: string;
  tokenCounts?: LiveProviderTokenCounts;
  providerName?: LiveProviderName;
  audit: LiveProviderStubAuditRecord;
  /** Always present. Explicitly documents the stub-only nature so a
   * surface reading this response cannot pretend a live call happened. */
  honestNote: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GATEWAY_VERSION = 'mg3.live-provider-stub.v1';

const HONEST_NOTE =
  'Live provider not implemented; this stub returns stubbed_live ' +
  'completions with deterministic token counts and latency. No real ' +
  'provider SDK was called. MG3 is the live-provider stub layer of ' +
  'the model gateway pipeline.';

// Maps canonical tier model names (from MG2) to fake provider names.
// Must NOT reference real provider SDK names.
const CANONICAL_MODEL_TO_PROVIDER: Record<string, LiveProviderName> = {
  canonical_premium_compose_v1: 'provider-alpha',
  canonical_balanced_compose_v1: 'provider-beta',
  canonical_economy_compose_v1: 'provider-gamma',
  canonical_local_rerank_v1: 'provider-local',
};

// Base stub latency (ms) per canonical provider. Deterministic constant.
const PROVIDER_BASE_LATENCY_MS: Record<LiveProviderName, number> = {
  'provider-alpha': 2400,
  'provider-beta': 900,
  'provider-gamma': 380,
  'provider-local': 90,
};

// Chars-per-token estimate for prompt sizing. A rough heuristic;
// the live gateway will compute real token counts from a tokeniser.
const CHARS_PER_TOKEN = 4;

// ─── Internal helpers (deterministic, no SDK / Date / random / fetch) ─────────

/**
 * Deterministic 32-bit string hash → lowercase hex (12 chars).
 * Identical to the helper in model-gateway-stub.ts so invocationIds
 * are comparable but namespaced differently.
 */
function deterministicHashHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  const unsigned = (h >>> 0).toString(16).padStart(8, '0');
  const lenComponent = (input.length & 0xffff).toString(16).padStart(4, '0');
  return (unsigned + lenComponent).slice(0, 12);
}

function buildInvocationId(
  tenantKey: string,
  agentKey: string,
  intent: string,
): string {
  const hash = deterministicHashHex(intent).slice(0, 12);
  const safeTenant = tenantKey.length > 0 ? tenantKey : 'unscoped';
  const safeAgent = agentKey.length > 0 ? agentKey : 'unknown';
  return 'mg3-live-' + safeTenant + '-' + safeAgent + '-' + hash;
}

function resolveProviderName(modelName: string): LiveProviderName | 'unknown' {
  return CANONICAL_MODEL_TO_PROVIDER[modelName] ?? 'unknown';
}

/**
 * Deterministic token count estimation.
 * promptTokens ≈ intent.length / CHARS_PER_TOKEN (floor).
 * completionTokens ≈ min(256, promptTokens * 2) but deterministically
 * bounded at 512.
 */
export function estimateTokenCounts(
  intent: string,
  _modelName: string,
): LiveProviderTokenCounts {
  const promptTokens = Math.max(
    1,
    Math.floor(intent.length / CHARS_PER_TOKEN),
  );
  // Completion estimate: twice the prompt up to 512 tokens.
  const completionTokens = Math.min(512, promptTokens * 2);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

/**
 * Deterministic stub latency.
 * base per provider + a bounded delta derived from the intent length.
 */
function deriveStubLatencyMs(
  providerName: LiveProviderName | 'unknown',
  intent: string,
): number {
  const base =
    providerName !== 'unknown'
      ? PROVIDER_BASE_LATENCY_MS[providerName]
      : 500;
  // Delta: 0–255 ms, deterministic based on intent char sum.
  const delta = intent.length & 0xff;
  return base + delta;
}

/**
 * Deterministic stub completion text.
 * The output is a stable short string that references the intent prefix
 * and the resolved model name. It deliberately does NOT look like a
 * real LLM output to avoid confusion.
 */
export function generateStubCompletion(
  intent: string,
  modelName: string,
): string {
  const intentPreview =
    intent.length > 40 ? intent.slice(0, 40) + '...' : intent;
  const hash = deterministicHashHex(intent + '|' + modelName).slice(0, 8);
  return (
    '[MG3 stub] Deterministic completion for intent: "' +
    intentPreview +
    '" routed via ' +
    modelName +
    '. Stub hash: ' +
    hash +
    '. No live provider was called.'
  );
}

function dedupeAndSortPolicies(
  policies: ReadonlyArray<ModelGatewayPolicy>,
): ReadonlyArray<ModelGatewayPolicy> {
  const seen = new Set<ModelGatewayPolicy>();
  for (const p of policies) {
    seen.add(p);
  }
  return Array.from(seen).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildRouteHashSeed(route: ModelGatewayRoute): string {
  return deterministicHashHex(
    route.modelName + '|' + route.tier + '|' + route.fallbackChain.join(','),
  );
}

function buildAudit(args: {
  request: ModelGatewayRequest;
  route: ModelGatewayRoute;
  decision: LiveProviderDecision;
  reason?: ModelGatewayBlockedReason;
  providerName: LiveProviderName | 'unknown';
  tokenCounts: LiveProviderTokenCounts;
  stubLatencyMs: number;
}): LiveProviderStubAuditRecord {
  const { request, route, decision, reason, providerName, tokenCounts, stubLatencyMs } =
    args;
  const audit: LiveProviderStubAuditRecord = {
    invocationId: buildInvocationId(
      request.tenantKey,
      request.agentKey,
      request.intent,
    ),
    tenantKey: request.tenantKey,
    agentKey: request.agentKey,
    decision,
    providerName,
    modelNameResolved: route.modelName,
    tokenCounts,
    stubLatencyMs,
    policiesEnforced: dedupeAndSortPolicies(request.policies),
    trace: {
      gatewayVersion: GATEWAY_VERSION,
      routeHashSeed: buildRouteHashSeed(route),
    },
  };
  if (reason !== undefined) {
    audit.reason = reason;
  }
  return audit;
}

function buildBlockResponse(
  request: ModelGatewayRequest,
  route: ModelGatewayRoute,
  reason: ModelGatewayBlockedReason,
): LiveProviderStubResponse {
  const zeroTokens: LiveProviderTokenCounts = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  return {
    decision: 'block',
    reason,
    audit: buildAudit({
      request,
      route,
      decision: 'block',
      reason,
      providerName: 'unknown',
      tokenCounts: zeroTokens,
      stubLatencyMs: 0,
    }),
    honestNote: HONEST_NOTE,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Factory to build a LiveProviderStubRequest from a validated
 * ModelGatewayRequest and its resolved route.
 */
export function buildLiveProviderStubRequest(
  gatewayRequest: ModelGatewayRequest,
  route: ModelGatewayRoute,
): LiveProviderStubRequest {
  return { gatewayRequest, route };
}

/**
 * Derives the canonical fake provider name for a given canonical model name.
 * Exported so surfaces can show "routed via provider-beta" without
 * importing the full invocation pipeline.
 */
export function deriveProviderName(
  canonicalModelName: string,
): LiveProviderName | 'unknown' {
  return resolveProviderName(canonicalModelName);
}

/**
 * Simulate a live provider invocation.
 *
 * Guards:
 * - Empty tenantKey → block (tenant_scope_invalid)
 * - Empty intent → block (context_pack_missing)
 * - Empty contextPackRef → block (context_pack_missing)
 * - Unknown modelName (not in canonical map) → returns stubbed_live
 *   with providerName: 'unknown' (live gateway must resolve; stub
 *   does not block on this)
 *
 * Well-formed requests → decision: 'stubbed_live' with a deterministic
 * completion, token counts, stub latency, and full audit record.
 */
export function invokeLiveProviderStub(
  stubRequest: LiveProviderStubRequest,
): LiveProviderStubResponse {
  const { gatewayRequest: request, route } = stubRequest;

  // Guard: tenant scope
  if (
    typeof request.tenantKey !== 'string' ||
    request.tenantKey.length === 0
  ) {
    return buildBlockResponse(request, route, 'tenant_scope_invalid');
  }
  // Guard: intent must be present (context pack)
  if (typeof request.intent !== 'string' || request.intent.length === 0) {
    return buildBlockResponse(request, route, 'context_pack_missing');
  }
  // Guard: context pack ref must be present
  if (
    typeof request.contextPackRef !== 'string' ||
    request.contextPackRef.length === 0
  ) {
    return buildBlockResponse(request, route, 'context_pack_missing');
  }

  // Resolve provider and compute deterministic outputs
  const providerName = resolveProviderName(route.modelName);
  const tokenCounts = estimateTokenCounts(request.intent, route.modelName);
  const stubLatencyMs = deriveStubLatencyMs(providerName, request.intent);
  const completionText = generateStubCompletion(request.intent, route.modelName);

  return {
    decision: 'stubbed_live',
    completionText,
    tokenCounts,
    providerName: providerName !== 'unknown' ? providerName : undefined,
    audit: buildAudit({
      request,
      route,
      decision: 'stubbed_live',
      providerName,
      tokenCounts,
      stubLatencyMs,
    }),
    honestNote: HONEST_NOTE,
  };
}

/**
 * Renders a deterministic single-line summary of a stub response.
 * e.g. "mg3:apexretail:nexus -> stubbed_live via provider-beta [invoc mg3-live-...]"
 */
export function summarizeLiveProviderStubResponse(
  response: LiveProviderStubResponse,
): string {
  const reasonSegment =
    response.reason !== undefined ? ' (' + response.reason + ')' : '';
  const providerSegment =
    response.providerName !== undefined
      ? ' via ' + response.providerName
      : '';
  return (
    'mg3:' +
    response.audit.tenantKey +
    ':' +
    response.audit.agentKey +
    ' -> ' +
    response.decision +
    reasonSegment +
    providerSegment +
    ' [invoc ' +
    response.audit.invocationId +
    ']'
  );
}
