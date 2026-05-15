// Diff logic for the parallel-run harness. Kept in src/ (not scripts/)
// so it is reachable by jest without TS pathing weirdness.
//
// Two layers live here:
//
//   1. buildInvariantReport / countFailures — the original binary
//      (matched / not-matched) substrate diff. Still exported and used.
//
//   2. buildParallelRunDiff — the founder-readable layer. It folds the
//      substrate diff together with connectivity health and authenticated-
//      surface probes into a single tri-state report:
//        pass             — both sides agree
//        warn             — small/transient drift, rerun likely clears it
//        fail             — real divergence; cutover blocked
//        preflight-blocked — could not run (token/cookie not supplied)
//      and computes a green / yellow / red verdict for the founder.
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

// ---------------------------------------------------------------------------
// Founder-readable tri-state layer
// ---------------------------------------------------------------------------

export type Severity = 'pass' | 'warn' | 'fail' | 'preflight-blocked';

/** A row count that drifts by this much or less is a transient writer race. */
export const COUNT_DRIFT_WARN_TOLERANCE = 5;

/** Which invariant keys are count-style (warn-tolerant) vs exact-only. */
const COUNT_KEYS: ReadonlySet<InvariantKey> = new Set<InvariantKey>([
  'nodes',
  'edges',
  'contextChunks',
  'segments',
  'programs',
  'sourceEvents',
]);

const INVARIANT_LABELS: Record<InvariantKey, string> = {
  nodes: 'graph nodes',
  edges: 'graph edges',
  contextChunks: 'context chunks',
  segments: 'data segments',
  programs: 'programs',
  topKpiNames: 'top-3 KPI names',
  topPatternIds: 'top-3 pattern IDs',
  sourceEvents: 'source events',
};

/** Parsed result of probing one backend's `/api/health`. */
export interface BackendHealth {
  reachable: boolean;
  status: number | null;
  /** Value of the `postgres` health check, when the endpoint reports one. */
  postgres: string | null;
  error: string | null;
}

/** Parsed result of probing one backend's authenticated surface. */
export interface AuthProbe {
  attempted: boolean;
  path: string | null;
  status: number | null;
  ok: boolean;
  error: string | null;
}

/** Everything the harness collected from one backend. */
export interface BackendProbe {
  /** Founder-readable label, e.g. "prod" or "azure-lab". */
  label: string;
  baseUrl: string;
  health: BackendHealth;
  /** Invariant payload, or null if not fetched / fetch failed. */
  invariants: InvariantPayload | null;
  invariantsStatus: number | null;
  invariantsError: string | null;
  authProbe: AuthProbe;
}

export interface BuildDiffOptions {
  left: BackendProbe;
  right: BackendProbe;
  /** Restrict tenant-fact lines to these canonical keys; null = all. */
  tenantFilter: string[] | null;
  /** True once a bearer token was supplied (whether or not it worked). */
  invariantTokenSupplied: boolean;
  /** True once an auth cookie was supplied. */
  authCookieSupplied: boolean;
}

/** One comparison row in the founder-readable report. */
export interface InvariantLine {
  category: 'connectivity' | 'tenant-fact' | 'authenticated-surface';
  label: string;
  tenantKey?: string;
  /** Founder-readable left value. */
  left: string;
  /** Founder-readable right value. */
  right: string;
  severity: Severity;
  note?: string;
}

export interface DiffVerdict {
  overall: 'green' | 'yellow' | 'red';
  pass: number;
  warn: number;
  fail: number;
  preflightBlocked: number;
  headline: string;
}

export interface ParallelRunDiff {
  generatedAt: string;
  left: { label: string; baseUrl: string };
  right: { label: string; baseUrl: string };
  lines: InvariantLine[];
  verdict: DiffVerdict;
}

function healthLine(label: string, h: BackendHealth): InvariantLine {
  // No response at all (DNS / connection refused / timeout) is a hard
  // fail — the backend is down. A response with a 4xx/5xx status means
  // the backend is UP but its health aggregator flags a degraded
  // sub-service; that is a warning, not a cutover blocker. The dedicated
  // postgres-reachability line below carries the substrate-critical
  // signal — a degraded non-DB service does not block a substrate diff.
  if (!h.reachable || h.status === null) {
    return {
      category: 'connectivity',
      label: `${label} /api/health`,
      left: label,
      right: h.error ?? 'unreachable',
      severity: 'fail',
      note: 'backend did not respond — it is down or unreachable',
    };
  }
  if (h.status >= 400) {
    return {
      category: 'connectivity',
      label: `${label} /api/health`,
      left: label,
      right: `HTTP ${h.status}`,
      severity: 'warn',
      note: 'backend is up but its health aggregator reports a degraded sub-service — see the postgres line for substrate impact',
    };
  }
  return {
    category: 'connectivity',
    label: `${label} /api/health`,
    left: label,
    right: `HTTP ${h.status}`,
    severity: 'pass',
  };
}

function postgresLine(label: string, h: BackendHealth): InvariantLine | null {
  if (h.postgres === null) return null;
  const ok = /^(ok|true|healthy|up|pass)$/i.test(h.postgres);
  return {
    category: 'connectivity',
    label: `${label} postgres reachability`,
    left: label,
    right: h.postgres,
    severity: ok ? 'pass' : 'warn',
    note: ok ? undefined : 'postgres check is not green — substrate reads may be degraded',
  };
}

function describeCount(c: CheckResult): { left: string; right: string } {
  return { left: String(c.a), right: String(c.b) };
}

function describeList(c: CheckResult): { left: string; right: string } {
  const fmt = (v: unknown) => (Array.isArray(v) ? v.join(', ') : String(v));
  return { left: fmt(c.a), right: fmt(c.b) };
}

function tenantFactLine(
  tenantKey: string,
  key: InvariantKey,
  check: CheckResult,
): InvariantLine {
  const label = INVARIANT_LABELS[key];
  if (COUNT_KEYS.has(key)) {
    const { left, right } = describeCount(check);
    const a = typeof check.a === 'number' ? check.a : NaN;
    const b = typeof check.b === 'number' ? check.b : NaN;
    const drift = Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) : Infinity;
    let severity: Severity;
    let note: string | undefined;
    if (drift === 0) {
      severity = 'pass';
    } else if (drift <= COUNT_DRIFT_WARN_TOLERANCE) {
      severity = 'warn';
      note = `off by ${drift} — likely an in-flight writer; rerun in 60s before treating as a failure`;
    } else {
      severity = 'fail';
      note = `off by ${drift} — substrate divergence; investigate the writer / copy job`;
    }
    return { category: 'tenant-fact', label, tenantKey, left, right, severity, note };
  }
  // List-style invariants: exact content + order, no warn tier.
  const { left, right } = describeList(check);
  return {
    category: 'tenant-fact',
    label,
    tenantKey,
    left,
    right,
    severity: check.matched ? 'pass' : 'fail',
    note: check.matched ? undefined : 'content or order differs — real seed/binding divergence',
  };
}

function authLine(label: string, probe: AuthProbe): InvariantLine {
  if (!probe.attempted) {
    return {
      category: 'authenticated-surface',
      label: `${label} authenticated surface`,
      left: label,
      right: 'not probed',
      severity: 'preflight-blocked',
      note: 'supply --auth-cookie to probe an authenticated surface, or run the Lane C authenticated matrix',
    };
  }
  if (probe.ok) {
    return {
      category: 'authenticated-surface',
      label: `${label} authenticated surface`,
      left: probe.path ?? 'surface',
      right: `HTTP ${probe.status}`,
      severity: 'pass',
    };
  }
  return {
    category: 'authenticated-surface',
    label: `${label} authenticated surface`,
    left: probe.path ?? 'surface',
    right: probe.status !== null ? `HTTP ${probe.status}` : (probe.error ?? 'unreachable'),
    severity: 'fail',
    note: 'authenticated GET did not return 200 — session cookie may be invalid or the surface is down',
  };
}

/**
 * Fold connectivity + substrate + authenticated probes into a single
 * founder-readable tri-state diff with a green/yellow/red verdict.
 */
export function buildParallelRunDiff(opts: BuildDiffOptions): ParallelRunDiff {
  const { left, right } = opts;
  const lines: InvariantLine[] = [];

  // --- Connectivity (always runnable, no auth) ---------------------------
  lines.push(healthLine(left.label, left.health));
  lines.push(healthLine(right.label, right.health));
  const pgLeft = postgresLine(left.label, left.health);
  const pgRight = postgresLine(right.label, right.health);
  if (pgLeft) lines.push(pgLeft);
  if (pgRight) lines.push(pgRight);

  // --- Same-backend guard ------------------------------------------------
  const markerL = left.invariants?.backendMarker;
  const markerR = right.invariants?.backendMarker;
  if (markerL && markerR && markerL === markerR) {
    lines.push({
      category: 'connectivity',
      label: 'distinct backends',
      left: markerL,
      right: markerR,
      severity: 'warn',
      note: 'left and right resolved to the same backend marker — check the --left/--right URLs',
    });
  }

  // --- Tenant-fact invariants (token-gated) ------------------------------
  if (!opts.invariantTokenSupplied) {
    const tenants = opts.tenantFilter ?? ['(all canonical tenants)'];
    for (const t of tenants) {
      lines.push({
        category: 'tenant-fact',
        label: 'substrate parity',
        tenantKey: t,
        left: 'n/a',
        right: 'n/a',
        severity: 'preflight-blocked',
        note: 'supply --invariant-token (or PARALLEL_RUN_INVARIANT_TOKEN); the endpoint 403s without it on both backends',
      });
    }
  } else if (!left.invariants || !right.invariants) {
    // Token supplied but at least one backend did not return a payload.
    const blocked = (p: BackendProbe): boolean => p.invariants === null;
    for (const p of [left, right]) {
      if (!blocked(p)) continue;
      const is403 = p.invariantsStatus === 403;
      lines.push({
        category: 'tenant-fact',
        label: `${p.label} invariants endpoint`,
        left: p.label,
        right: p.invariantsStatus !== null ? `HTTP ${p.invariantsStatus}` : (p.invariantsError ?? 'unreachable'),
        severity: is403 ? 'preflight-blocked' : 'fail',
        note: is403
          ? 'token rejected — re-project PARALLEL_RUN_INVARIANT_TOKEN so both backends share the same value'
          : 'invariants endpoint failed — check the backend logs',
      });
    }
  } else {
    const report = buildInvariantReport(left.invariants, right.invariants);
    for (const skip of report.skipped) {
      lines.push({
        category: 'tenant-fact',
        label: 'tenant presence',
        left: 'present',
        right: 'missing',
        severity: 'fail',
        note: skip,
      });
    }
    for (const row of report.perTenant) {
      if (opts.tenantFilter && !opts.tenantFilter.includes(row.tenantKey)) continue;
      for (const [key, check] of Object.entries(row.checks)) {
        if (!check) continue;
        lines.push(tenantFactLine(row.tenantKey, key as InvariantKey, check));
      }
    }
  }

  // --- Authenticated surface (cookie-gated) ------------------------------
  if (!opts.authCookieSupplied) {
    lines.push({
      category: 'authenticated-surface',
      label: 'authenticated surface parity',
      left: 'n/a',
      right: 'n/a',
      severity: 'preflight-blocked',
      note: 'supply --auth-cookie to probe an authenticated surface; full CXO matrix is Lane C (azure-l6-primary-surfaces)',
    });
  } else {
    lines.push(authLine(left.label, left.authProbe));
    lines.push(authLine(right.label, right.authProbe));
  }

  // --- Verdict -----------------------------------------------------------
  const pass = lines.filter((l) => l.severity === 'pass').length;
  const warn = lines.filter((l) => l.severity === 'warn').length;
  const fail = lines.filter((l) => l.severity === 'fail').length;
  const preflightBlocked = lines.filter((l) => l.severity === 'preflight-blocked').length;

  let overall: DiffVerdict['overall'];
  let headline: string;
  if (fail > 0) {
    overall = 'red';
    headline = `Substrate divergence detected — ${fail} failing check${fail === 1 ? '' : 's'}. Cutover blocked.`;
  } else if (warn > 0 || preflightBlocked > 0) {
    overall = 'yellow';
    const parts: string[] = [];
    if (preflightBlocked > 0) parts.push(`${preflightBlocked} preflight-blocked`);
    if (warn > 0) parts.push(`${warn} warning${warn === 1 ? '' : 's'}`);
    headline = `No divergence found, but ${parts.join(' and ')} — supply the missing token/cookie and rerun to complete the proof.`;
  } else {
    overall = 'green';
    headline = `Full parity — all ${pass} checks pass. Cutover gate clear for this run.`;
  }

  return {
    generatedAt: new Date().toISOString(),
    left: { label: left.label, baseUrl: left.baseUrl },
    right: { label: right.label, baseUrl: right.baseUrl },
    lines,
    verdict: { overall, pass, warn, fail, preflightBlocked, headline },
  };
}
