// Data-plane read-adapter contract.
//
// AbarVa is moving toward an Azure parallel-run cutover. Today most app/API
// read paths call Supabase directly, which makes "run production and Azure
// side by side" impossible without route rewrites. This module defines a
// thin adapter seam so the backing store becomes an implementation detail.
//
// Slice 1 scope: the cutover-critical, read-only, low-write-risk path
// `/api/admin/parallel-run-invariants`. The route calls a `ParallelRunReadAdapter`
// instead of Supabase directly; the concrete adapter is selected by the
// `ABARVA_DATA_PLANE` env var (default: `supabase` — unchanged production
// behavior).
//
// This file is the single source of truth for the shapes. The route
// re-exports `TenantInvariants` / `ParallelRunInvariantPayload` for callers
// that still import from it.

/**
 * Which physical data plane an adapter targets.
 *
 * - `supabase`        — current production path (Supabase REST / service role).
 * - `azure-postgres`  — Azure lab path (direct Postgres over `pg`).
 */
export type DataPlane = 'supabase' | 'azure-postgres';

/**
 * Per-tenant canonical aggregates compared by the parallel-run diff harness.
 *
 * IMPORTANT: this shape is load-bearing. `scripts/parallel-run-diff.ts` and
 * `src/lib/parallel-run/invariant-diff.ts` depend on it field-for-field. Do
 * not rename or drop fields without updating the harness in lockstep.
 */
export interface TenantInvariants {
  tenantKey: string;
  clientId: string | null;
  clientName: string | null;
  nodes: number;
  edges: number;
  contextChunks: number;
  segments: number;
  programs: number;
  topKpiNames: string[];
  topPatternIds: string[];
  sourceEvents: number;
}

/** Full response payload returned by `/api/admin/parallel-run-invariants`. */
export interface ParallelRunInvariantPayload {
  schemaVersion: 1;
  generatedAt: string;
  backendMarker: string;
  tenants: TenantInvariants[];
  totals: {
    nodes: number;
    edges: number;
    contextChunks: number;
    programs: number;
  };
}

/**
 * A read adapter gathers parallel-run invariants from one physical data
 * plane. Implementations MUST:
 *   - canonicalize tenant keys on the way in (`canonicalTenantKey`);
 *   - never throw for a missing optional table/row — return 0 / [] instead,
 *     so the route degrades gracefully rather than 500-ing;
 *   - perform read-only queries only.
 */
export interface ParallelRunReadAdapter {
  readonly name: DataPlane;
  /**
   * Gather invariants for the given tenant keys (which may be historical
   * aliases — the adapter canonicalizes them).
   */
  getTenantInvariants(tenantKeys: readonly string[]): Promise<TenantInvariants[]>;
}

/** The five tenant-scoped count tables, by `tenant_key`. Adapter allowlist. */
export const TENANT_COUNT_TABLES = {
  nodes: 'enterprise_graph_nodes',
  edges: 'enterprise_graph_edges',
  contextChunks: 'enterprise_context_chunks',
  segments: 'data_inventory_segments',
  sourceEvents: 'source_events',
} as const;

export type TenantCountKey = keyof typeof TENANT_COUNT_TABLES;

/** An empty per-tenant record — the safe fallback when a tenant has no data. */
export function emptyTenantInvariants(tenantKey: string): TenantInvariants {
  return {
    tenantKey,
    clientId: null,
    clientName: null,
    nodes: 0,
    edges: 0,
    contextChunks: 0,
    segments: 0,
    programs: 0,
    topKpiNames: [],
    topPatternIds: [],
    sourceEvents: 0,
  };
}
