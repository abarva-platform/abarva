// Diff logic for the parallel-run harness. Kept in src/ (not scripts/)
// so it is reachable by jest without TS pathing weirdness.
//
// Invariants asserted (per tenant, exact match required):
//   - nodes            (enterprise_graph_nodes row count)
//   - edges            (enterprise_graph_edges row count)
//   - contextChunks    (enterprise_context_chunks row count)
//   - segments         (data_inventory_segments row count)
//   - programs         (engagements row count for the tenant's client_id)
//   - topKpiNames      (first 3 KPI names by id ASC)
//   - topPatternIds    (first 3 pattern_packs ids by id ASC)
//   - sourceEvents     (source_events row count)
//
// Embeddings / vector retrieval ordering is intentionally NOT compared
// here — it is non-deterministic across backends (different model lanes,
// different index builds). The harness compares the deterministic
// substrate-row aggregates only.

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

export interface InvariantPayload {
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

export interface CheckResult<T = unknown> {
  matched: boolean;
  a: T;
  b: T;
  note?: string;
}

export type InvariantKey =
  | 'nodes'
  | 'edges'
  | 'contextChunks'
  | 'segments'
  | 'programs'
  | 'topKpiNames'
  | 'topPatternIds'
  | 'sourceEvents';

export interface TenantDiffRow {
  tenantKey: string;
  checks: Partial<Record<InvariantKey, CheckResult>>;
}

export interface DiffReport {
  total: number;
  matched: number;
  skipped: string[];
  perTenant: TenantDiffRow[];
}

function sameNumber(a: number, b: number): CheckResult<number> {
  return { matched: a === b, a, b };
}

function sameStringList(a: string[], b: string[]): CheckResult<string[]> {
  const matched = a.length === b.length && a.every((v, i) => v === b[i]);
  return { matched, a, b };
}

/**
 * Build a per-tenant diff report from two invariant payloads.
 *
 * If either side is null, the report returns an empty per-tenant array
 * and a single skip entry — the harness uses that to render "backend
 * unreachable" in the report.
 */
export function buildInvariantReport(
  a: InvariantPayload | null,
  b: InvariantPayload | null,
): DiffReport {
  if (!a || !b) {
    return {
      total: 0,
      matched: 0,
      skipped: [a ? 'B' : 'A', b ? 'A' : 'B'].filter((v, i, arr) => arr.indexOf(v) === i),
      perTenant: [],
    };
  }

  const tenantsA = new Map(a.tenants.map((t) => [t.tenantKey, t]));
  const tenantsB = new Map(b.tenants.map((t) => [t.tenantKey, t]));
  const tenantKeys = Array.from(
    new Set([...tenantsA.keys(), ...tenantsB.keys()]),
  ).sort();

  let total = 0;
  let matched = 0;
  const skipped: string[] = [];
  const perTenant: TenantDiffRow[] = [];

  for (const key of tenantKeys) {
    const ta = tenantsA.get(key);
    const tb = tenantsB.get(key);
    if (!ta || !tb) {
      skipped.push(`tenant ${key} missing on ${!ta ? 'A' : 'B'}`);
      continue;
    }
    const checks: Partial<Record<InvariantKey, CheckResult>> = {
      nodes: sameNumber(ta.nodes, tb.nodes),
      edges: sameNumber(ta.edges, tb.edges),
      contextChunks: sameNumber(ta.contextChunks, tb.contextChunks),
      segments: sameNumber(ta.segments, tb.segments),
      programs: sameNumber(ta.programs, tb.programs),
      topKpiNames: sameStringList(ta.topKpiNames, tb.topKpiNames),
      topPatternIds: sameStringList(ta.topPatternIds, tb.topPatternIds),
      sourceEvents: sameNumber(ta.sourceEvents, tb.sourceEvents),
    };
    for (const c of Object.values(checks)) {
      if (!c) continue;
      total += 1;
      if (c.matched) matched += 1;
    }
    perTenant.push({ tenantKey: key, checks });
  }

  return { total, matched, skipped, perTenant };
}

/**
 * Count the number of failing invariants in a report. Convenience for
 * tests / CI scripts that don't need to walk the structure.
 */
export function countFailures(report: DiffReport): number {
  return report.total - report.matched;
}
