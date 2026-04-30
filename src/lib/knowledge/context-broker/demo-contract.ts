import 'server-only';

/**
 * CB-4 · request / response contract for `POST /api/context/demo`.
 *
 * Lives in the broker package (not the route file) so client-side
 * fetchers can `import type { ContextDemoRequest } from '@/lib/knowledge/context-broker'`
 * and stay in sync with the server's validator. The route file
 * imports these types directly so the validator never drifts from
 * the contract.
 *
 * Per CONTEXT_BROKER_DESIGN.md §7 (CB-4) — the demo endpoint is the
 * "deterministic demo endpoint" the founder named in the roadmap. It
 * exists so the retrieval pipeline can be inspected as JSON without
 * the LLM in the loop.
 */

import type { BrokerMode, ContextBundle } from './types';

/**
 * Hard cap on the request `query` field. Defends the broker (and the
 * downstream embedding job, when CB-3 lights up vector retrieval) from
 * unbounded input. 2000 chars is generous for a question; longer
 * payloads almost certainly indicate misuse and should fail fast at
 * the route boundary.
 */
export const CONTEXT_DEMO_QUERY_MAX_LENGTH = 2000;

/**
 * Request body accepted by `POST /api/context/demo`.
 *
 * - `query` is required, non-empty after trim, ≤ CONTEXT_DEMO_QUERY_MAX_LENGTH.
 * - `mode` is required; must be one of the four broker modes.
 * - `tenantKey` is required for `tenant` / `full`, ignored for `generic` / `corpus`.
 *   When supplied, the route validates that it matches the caller's
 *   active client (post `clientKeyToBrokerTenantKey` mapping) and 403s
 *   on mismatch.
 * - `maxFacts` / `maxChunks` / `graphTraversalDepth` are passthroughs
 *   to `ContextBroker.assemble`; the broker clamps them to its own
 *   ceilings.
 */
export interface ContextDemoRequest {
  query: string;
  mode: BrokerMode | 'all';
  tenantKey?: string;
  maxFacts?: number;
  maxChunks?: number;
  graphTraversalDepth?: number;
}

/** Successful response — the broker bundle echoed as JSON. */
export interface ContextDemoResponse {
  ok: true;
  bundle?: ContextBundle;
  bundles?: {
    generic: ContextBundle;
    corpus: ContextBundle;
    tenant: ContextBundle | null;
    full: ContextBundle | null;
  };
  summaries?: {
    generic: ContextDemoBundleSummary;
    corpus: ContextDemoBundleSummary;
    tenant: ContextDemoBundleSummary | null;
    full: ContextDemoBundleSummary | null;
  };
}

export interface ContextDemoBundleSummary {
  mode: BrokerMode;
  factCount: number;
  graphPathCount: number;
  semanticChunkCount: number;
  corpusPatternCount: number;
  provenanceCount: number;
  warningCount: number;
}

/** Failure response — sanitized message + optional error code. */
export interface ContextDemoErrorResponse {
  ok: false;
  error: string;
  /**
   * Optional stable code for client-side branching. Today the only
   * coded error is the broker's `MissingTenantKeyError`
   * (`CONTEXT_BROKER_TENANT_KEY_REQUIRED`); future codes can be added
   * here without changing the response shape.
   */
  code?: string;
}
