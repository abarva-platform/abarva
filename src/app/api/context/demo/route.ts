/**
 * POST /api/context/demo · CB-4 (pilot-ready)
 *
 * Deterministic endpoint that returns a `ContextBundle` as JSON. No
 * LLM is involved — this is the founder-named "deterministic demo
 * endpoint" that exposes the retrieval pipeline standalone of the
 * chat surface so it can be inspected, demoed, and regression-tested
 * before the LLM is wired in (CB-6).
 *
 * Per docs/build/CONTEXT_BROKER_DESIGN.md §7 (CB-4) and the kickoff
 * doc Wave-1 build order. Consumers:
 *   - CB-5 Context Assembled panel renders the bundle beside the answer
 *   - CB-6 4-mode toggle UX uses this endpoint for per-mode previews
 *   - Demo recordings show retrieval without needing the LLM running
 *   - HTTP smoke tests verify the broker is reachable end-to-end
 *
 * Request shape — typed in `@/lib/knowledge/context-broker` as
 * `ContextDemoRequest`:
 *   POST /api/context/demo
 *   {
 *     "query": "Why is Apex CDP at risk?",
 *     "mode":  "tenant",                  // 'generic'|'corpus'|'tenant'|'full'
 *     "tenantKey": "apex-retail",         // required for tenant/full
 *     "maxFacts": 12,                     // optional broker passthrough
 *     "maxChunks": 8,                     //  ”
 *     "graphTraversalDepth": 2            //  ”
 *   }
 *
 * Response (200) — `ContextDemoResponse`:
 *   { "ok": true, "bundle": ContextBundle }
 *
 * Errors — `ContextDemoErrorResponse`:
 *   400  invalid JSON / missing query / oversize query / invalid mode
 *        / missing tenantKey for tenant|full modes
 *   401  unauthenticated
 *   403  authenticated user's active client doesn't map to the
 *        requested tenantKey (post `clientKeyToBrokerTenantKey`
 *        normalization — closes the apex-retail / apexretail split)
 *   500  broker assembly failure (sanitized message, no internals)
 *
 * Cache: `Cache-Control: no-store` on every response. The bundle is a
 * query result, not a cacheable artifact, and tenant-scoped responses
 * MUST NOT be cached at any intermediary.
 *
 * Telemetry: posthog server-side capture isn't wired in this codebase,
 * so the route logs a structured `context.demo_assembled` line. When a
 * server-side posthog wrapper lands later, swap the `logTelemetry` call
 * for a real `client.capture` — the call site stays identical.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  CONTEXT_DEMO_QUERY_MAX_LENGTH,
  getContextBroker,
  MissingTenantKeyError,
  type BrokerMode,
  type ContextBundle,
  type ContextDemoBundleSummary,
  type ContextDemoErrorResponse,
  type ContextDemoRequest,
  type ContextDemoResponse,
} from '@/lib/knowledge/context-broker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_MODES: ReadonlyArray<BrokerMode> = ['generic', 'corpus', 'tenant', 'full'];
const TENANT_REQUIRED_MODES: ReadonlyArray<BrokerMode> = ['tenant', 'full'];
type RequestedMode = BrokerMode | 'all';

/** Headers attached to every response — bundle results are never cacheable. */
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

/**
 * The result of validating a parsed JSON body. Either a valid request
 * object or a `{ status, error, code? }` envelope the route returns
 * verbatim. Discriminated union so the route can branch on `kind`.
 */
type ValidationResult =
  | { kind: 'ok'; request: ContextDemoRequest }
  | { kind: 'error'; status: number; error: string; code?: string };

/** Tenancy context the route needs after auth resolves. */
interface DemoTenancyContext {
  userId: string;
  /** Broker-shaped tenant key derived from the active client. */
  activeBrokerTenantKey: string | null;
}

function jsonError(
  status: number,
  error: string,
  extra?: { code?: string },
): NextResponse {
  const body: ContextDemoErrorResponse = { ok: false, error };
  if (extra?.code) body.code = extra.code;
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function jsonOk(bundle: ContextBundle): NextResponse {
  const body: ContextDemoResponse = { ok: true, bundle };
  return NextResponse.json(body, { status: 200, headers: NO_STORE_HEADERS });
}

function jsonOkAll(args: {
  generic: ContextBundle;
  corpus: ContextBundle;
  tenant: ContextBundle | null;
  full: ContextBundle | null;
}): NextResponse {
  const body: ContextDemoResponse = {
    ok: true,
    bundles: args,
    summaries: {
      generic: bundleSummary(args.generic),
      corpus: bundleSummary(args.corpus),
      tenant: args.tenant ? bundleSummary(args.tenant) : null,
      full: args.full ? bundleSummary(args.full) : null,
    },
  };
  return NextResponse.json(body, { status: 200, headers: NO_STORE_HEADERS });
}

function bundleSummary(bundle: ContextBundle): ContextDemoBundleSummary {
  return {
    mode: bundle.mode,
    factCount: bundle.facts.length,
    graphPathCount: bundle.graphPaths.length,
    semanticChunkCount: bundle.semanticChunks.length,
    corpusPatternCount: bundle.corpusPatterns.length,
    provenanceCount: bundle.provenance.length,
    warningCount: bundle.warnings.length,
  };
}

/**
 * Validate a parsed request body against the contract. Pure function
 * — no side effects, no auth lookups — so it can be unit-tested
 * without a live request.
 */
export function validateDemoRequest(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      kind: 'error',
      status: 400,
      error: 'Request body must be a JSON object.',
    };
  }
  const obj = raw as Record<string, unknown>;

  // query — required, non-empty after trim, ≤ CONTEXT_DEMO_QUERY_MAX_LENGTH.
  if (typeof obj.query !== 'string') {
    return {
      kind: 'error',
      status: 400,
      error: '`query` is required and must be a string.',
    };
  }
  const query = obj.query.trim();
  if (query.length === 0) {
    return {
      kind: 'error',
      status: 400,
      error: '`query` is required and must be a non-empty string.',
    };
  }
  if (query.length > CONTEXT_DEMO_QUERY_MAX_LENGTH) {
    return {
      kind: 'error',
      status: 400,
      error: `\`query\` must be ${CONTEXT_DEMO_QUERY_MAX_LENGTH} characters or fewer (got ${query.length}).`,
    };
  }

  // mode — required, one of the four broker modes or all for the demo surface.
  if (typeof obj.mode !== 'string') {
    return {
      kind: 'error',
      status: 400,
      error: "`mode` is required; must be one of 'generic'|'corpus'|'tenant'|'full'|'all'.",
    };
  }
  if (obj.mode !== 'all' && !(VALID_MODES as ReadonlyArray<string>).includes(obj.mode)) {
    return {
      kind: 'error',
      status: 400,
      error: `\`mode\` must be one of 'generic'|'corpus'|'tenant'|'full'|'all' (got '${obj.mode}').`,
    };
  }
  const mode = obj.mode as RequestedMode;

  // tenantKey — required for tenant/full, ignored for generic/corpus.
  let tenantKey: string | undefined;
  if (typeof obj.tenantKey === 'string' && obj.tenantKey.trim().length > 0) {
    tenantKey = obj.tenantKey.trim();
  }
  if (mode !== 'all' && TENANT_REQUIRED_MODES.includes(mode) && !tenantKey) {
    return {
      kind: 'error',
      status: 400,
      error: `\`tenantKey\` is required for mode='${mode}'.`,
      code: 'CONTEXT_BROKER_TENANT_KEY_REQUIRED',
    };
  }

  // Optional broker passthroughs. Only forward when the caller sent a
  // finite number; the broker has its own clamps on top.
  const maxFacts = parseOptionalInteger(obj.maxFacts, 'maxFacts');
  if (maxFacts.kind === 'error') return maxFacts;

  const maxChunks = parseOptionalInteger(obj.maxChunks, 'maxChunks');
  if (maxChunks.kind === 'error') return maxChunks;

  const graphTraversalDepth = parseOptionalInteger(
    obj.graphTraversalDepth,
    'graphTraversalDepth',
  );
  if (graphTraversalDepth.kind === 'error') return graphTraversalDepth;

  const request: ContextDemoRequest = {
    query,
    mode,
    ...(tenantKey ? { tenantKey } : {}),
    ...(maxFacts.value !== undefined ? { maxFacts: maxFacts.value } : {}),
    ...(maxChunks.value !== undefined ? { maxChunks: maxChunks.value } : {}),
    ...(graphTraversalDepth.value !== undefined
      ? { graphTraversalDepth: graphTraversalDepth.value }
      : {}),
  };
  return { kind: 'ok', request };
}

type OptionalIntegerResult =
  | { kind: 'ok'; value: number | undefined }
  | { kind: 'error'; status: number; error: string };

function parseOptionalInteger(raw: unknown, field: string): OptionalIntegerResult {
  if (raw === undefined || raw === null) return { kind: 'ok', value: undefined };
  if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw) || raw < 0) {
    return {
      kind: 'error',
      status: 400,
      error: `\`${field}\` must be a non-negative integer.`,
    };
  }
  return { kind: 'ok', value: raw };
}

/**
 * Resolve the caller's tenancy. Returns the user id + broker-shaped
 * tenant key for the active client (post `clientKeyToBrokerTenantKey`
 * mapping). Throws `TenancyError` from `requireTenancy()` on missing
 * auth or no active client; the route translates those to 401/403.
 */
export async function resolveDemoTenancy(): Promise<DemoTenancyContext> {
  const ctx = await requireTenancy();
  // Active client lookup is best-effort — `requireTenancy` already
  // guaranteed a session and a client; this fetch just carries the
  // ClientKey we need to translate into the broker's vocabulary.
  const client = await getActiveClientRow().catch(() => null);
  const activeBrokerTenantKey = client ? clientKeyToBrokerTenantKey(client.key) : null;
  return { userId: ctx.userId, activeBrokerTenantKey };
}

/**
 * Run the broker for a validated request inside a known tenancy
 * context. Pure orchestration: no HTTP coupling so it can be
 * unit-tested without constructing a NextRequest. Throws when the
 * caller is not allowed to access the requested tenant; the route
 * translates the throw into a 403 envelope.
 */
export async function assembleDemoBundle(
  request: ContextDemoRequest,
  ctx: DemoTenancyContext,
): Promise<ContextBundle> {
  if (request.mode === 'all') {
    throw new Error('assembleDemoBundle only supports a single broker mode.');
  }
  // Tenant-mode authorization gate. The caller's active client (in
  // broker-shaped form) MUST equal the requested tenantKey. We never
  // honor a caller-supplied tenantKey verbatim; that would let a
  // signed-in Apex user query Meridian.
  if (TENANT_REQUIRED_MODES.includes(request.mode)) {
    if (!ctx.activeBrokerTenantKey) {
      throw new ForbiddenTenantError(
        'No active client mapping for this user; cannot run tenant-scoped retrieval.',
      );
    }
    if (request.tenantKey !== ctx.activeBrokerTenantKey) {
      throw new ForbiddenTenantError(
        `tenantKey '${request.tenantKey}' does not match the caller's active client.`,
      );
    }
  }

  const broker = getContextBroker();
  return broker.assemble({
    query: request.query,
    mode: request.mode,
    ...(request.tenantKey ? { tenantKey: request.tenantKey } : {}),
    ...(request.maxFacts !== undefined ? { maxFacts: request.maxFacts } : {}),
    ...(request.maxChunks !== undefined ? { maxChunks: request.maxChunks } : {}),
    ...(request.graphTraversalDepth !== undefined
      ? { graphTraversalDepth: request.graphTraversalDepth }
      : {}),
  });
}

export async function assembleDemoBundles(
  request: ContextDemoRequest,
  ctx: DemoTenancyContext,
): Promise<{
  generic: ContextBundle;
  corpus: ContextBundle;
  tenant: ContextBundle | null;
  full: ContextBundle | null;
}> {
  if (request.mode !== 'all') {
    const bundle = await assembleDemoBundle(request, ctx);
    return {
      generic: bundle.mode === 'generic' ? bundle : brokerErrorBundle('not requested', request.query, 'generic'),
      corpus: bundle.mode === 'corpus' ? bundle : brokerErrorBundle('not requested', request.query, 'corpus'),
      tenant: bundle.mode === 'tenant' ? bundle : null,
      full: bundle.mode === 'full' ? bundle : null,
    };
  }

  const tenantKey = request.tenantKey;
  if (tenantKey) {
    ensureTenantAllowed(tenantKey, ctx);
  }

  const broker = getContextBroker();
  const [generic, corpus, tenant, full] = await Promise.all([
    broker.assemble({
      query: request.query,
      mode: 'generic',
      ...(request.maxFacts !== undefined ? { maxFacts: request.maxFacts } : {}),
      ...(request.maxChunks !== undefined ? { maxChunks: request.maxChunks } : {}),
      ...(request.graphTraversalDepth !== undefined
        ? { graphTraversalDepth: request.graphTraversalDepth }
        : {}),
    }),
    broker.assemble({
      query: request.query,
      mode: 'corpus',
      ...(request.maxFacts !== undefined ? { maxFacts: request.maxFacts } : {}),
      ...(request.maxChunks !== undefined ? { maxChunks: request.maxChunks } : {}),
      ...(request.graphTraversalDepth !== undefined
        ? { graphTraversalDepth: request.graphTraversalDepth }
        : {}),
    }),
    tenantKey
      ? broker
          .assemble({
            query: request.query,
            tenantKey,
            mode: 'tenant',
            ...(request.maxFacts !== undefined ? { maxFacts: request.maxFacts } : {}),
            ...(request.maxChunks !== undefined ? { maxChunks: request.maxChunks } : {}),
            ...(request.graphTraversalDepth !== undefined
              ? { graphTraversalDepth: request.graphTraversalDepth }
              : {}),
          })
          .catch((err) => brokerErrorBundle(err, request.query, 'tenant', tenantKey))
      : null,
    tenantKey
      ? broker
          .assemble({
            query: request.query,
            tenantKey,
            mode: 'full',
            ...(request.maxFacts !== undefined ? { maxFacts: request.maxFacts } : {}),
            ...(request.maxChunks !== undefined ? { maxChunks: request.maxChunks } : {}),
            ...(request.graphTraversalDepth !== undefined
              ? { graphTraversalDepth: request.graphTraversalDepth }
              : {}),
          })
          .catch((err) => brokerErrorBundle(err, request.query, 'full', tenantKey))
      : null,
  ]);

  return { generic, corpus, tenant, full };
}

function ensureTenantAllowed(tenantKey: string, ctx: DemoTenancyContext): void {
  if (!ctx.activeBrokerTenantKey) {
    throw new ForbiddenTenantError(
      'No active client mapping for this user; cannot run tenant-scoped retrieval.',
    );
  }
  if (tenantKey !== ctx.activeBrokerTenantKey) {
    throw new ForbiddenTenantError(
      `tenantKey '${tenantKey}' does not match the caller's active client.`,
    );
  }
}

/**
 * Sentinel error for the tenant-key cross-check. Not exported — the
 * route handles it inline.
 */
class ForbiddenTenantError extends Error {
  readonly code = 'CONTEXT_DEMO_FORBIDDEN_TENANT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenTenantError';
  }
}

/**
 * Structured telemetry sink. The codebase doesn't have a server-side
 * posthog wrapper; we log a JSON line tagged with the canonical event
 * name so an external collector / future wrapper can parse it.
 */
function logTelemetry(props: Record<string, unknown>): void {
  // Structured server-side telemetry; no posthog-node wrapper exists
  // in this codebase, so we log a JSON-friendly tagged line.
  console.info('[telemetry] context.demo_assembled', props);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();

  // 1. Auth gate. requireTenancy throws TenancyError for both
  //    unauthenticated (no Clerk user) and no-client cases; map them
  //    to 401 / 403 explicitly so clients can branch.
  let tenancy: DemoTenancyContext;
  try {
    tenancy = await resolveDemoTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      if (err.code === 'unauthenticated') {
        return jsonError(401, 'Authentication required.');
      }
      return jsonError(403, 'No active client for this user.');
    }
    return jsonError(500, 'Authentication check failed.');
  }

  // 2. Parse body (must come AFTER auth so we don't leak validator
  //    behavior to anonymous probes). Invalid JSON is a 400.
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  // 3. Validate against the contract.
  const validated = validateDemoRequest(parsed);
  if (validated.kind === 'error') {
    return jsonError(validated.status, validated.error, { code: validated.code });
  }

  // 4. Run the broker (with the tenant cross-check) and shape the response.
  try {
    if (validated.request.mode === 'all') {
      const bundles = await assembleDemoBundles(validated.request, tenancy);
      logTelemetry({
        mode: 'all',
        tenant_key: validated.request.tenantKey ?? null,
        facts_count: bundles.generic.facts.length +
          bundles.corpus.facts.length +
          (bundles.tenant?.facts.length ?? 0) +
          (bundles.full?.facts.length ?? 0),
        graph_paths_count: bundles.generic.graphPaths.length +
          bundles.corpus.graphPaths.length +
          (bundles.tenant?.graphPaths.length ?? 0) +
          (bundles.full?.graphPaths.length ?? 0),
        semantic_chunks_count: bundles.generic.semanticChunks.length +
          bundles.corpus.semanticChunks.length +
          (bundles.tenant?.semanticChunks.length ?? 0) +
          (bundles.full?.semanticChunks.length ?? 0),
        corpus_patterns_count: bundles.generic.corpusPatterns.length +
          bundles.corpus.corpusPatterns.length +
          (bundles.tenant?.corpusPatterns.length ?? 0) +
          (bundles.full?.corpusPatterns.length ?? 0),
        warnings_count: bundles.generic.warnings.length +
          bundles.corpus.warnings.length +
          (bundles.tenant?.warnings.length ?? 0) +
          (bundles.full?.warnings.length ?? 0),
        latency_ms: Date.now() - startedAt,
        actor_user_id: tenancy.userId,
      });
      return jsonOkAll(bundles);
    }

    const bundle = await assembleDemoBundle(validated.request, tenancy);
    logTelemetry({
      mode: bundle.mode,
      tenant_key: TENANT_REQUIRED_MODES.includes(bundle.mode) ? bundle.tenantKey : null,
      facts_count: bundle.facts.length,
      graph_paths_count: bundle.graphPaths.length,
      semantic_chunks_count: bundle.semanticChunks.length,
      corpus_patterns_count: bundle.corpusPatterns.length,
      warnings_count: bundle.warnings.length,
      latency_ms: Date.now() - startedAt,
      actor_user_id: tenancy.userId,
    });
    return jsonOk(bundle);
  } catch (err) {
    if (err instanceof MissingTenantKeyError) {
      return jsonError(400, err.message, { code: err.code });
    }
    if (err instanceof ForbiddenTenantError) {
      return jsonError(403, err.message, { code: err.code });
    }
    // Sanitize: log the real error for ops; return a generic message
    // so internals don't leak across the boundary.
    console.error('[POST /api/context/demo] broker_assemble_failed', {
      message: err instanceof Error ? err.message : String(err),
      mode: validated.request.mode,
      actorUserId: tenancy.userId,
    });
    return jsonError(500, 'Context bundle assembly failed.');
  }
}

function brokerErrorBundle(
  err: unknown,
  query: string,
  mode: BrokerMode,
  tenantKey?: string,
): ContextBundle {
  return {
    query,
    mode,
    tenantKey: tenantKey ?? null,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    worldviewChunks: [],
    provenance: [],
    warnings: [
      `broker_failure: ${err instanceof Error ? err.message : String(err)}`,
    ],
    infoTags: [],
    assembledAt: new Date().toISOString(),
  };
}
