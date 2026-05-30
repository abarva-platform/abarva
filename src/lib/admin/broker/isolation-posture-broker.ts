/**
 * Isolation Posture broker · Wave 2 PR-2
 *
 * Live per-tenant tenant-isolation posture for the Setup / Admin
 * Trust Plane. Replaces the `composeIsolation()` estimated stub in
 * `trust-spine-broker.ts` with real data sourced from the
 * `ai_egress_audit` ledger (canonical AI-egress + tenant-resolution
 * audit table, added in `20260522170000_ai_egress_control_plane.sql`
 * with the Clerk-string `user_id` patch in
 * `20260525020500_ai_egress_audit_user_id_text.sql`).
 *
 * Contract:
 *   getIsolationPosture(tenantKey) → IsolationPosture
 *
 * The broker's job is composition, not direct row exposure. The
 * `ai_egress_audit` table holds rich payload material — `prompt_hash`,
 * `response_hash`, `prompt_snapshot_ref`, `response_snapshot_ref`,
 * `request_metadata` — that we deliberately keep OUT of the broker's
 * `recentEvents` output. PII / payload-fingerprint material never
 * leaves this file. The UI surface (`IsolationLane.tsx`) renders
 * only the metadata columns the broker yields: severity, decision,
 * workflow, provider, route, data class, plus the actor id.
 *
 * Anomaly definition (intentionally conservative):
 *
 *   - `policy_decision IN ('deny', 'error')` — the egress writer
 *     declared a refusal or a hard error. Both are signal.
 *   - `error_message IS NOT NULL` — even if `policy_decision` is
 *     `allow`, a non-empty error_message means the call failed.
 *   - `data_class = 'restricted'` — the highest-sensitivity tier.
 *     Surfaces as a "high-severity anomaly" even if the call was
 *     allowed (an admin needs visibility into restricted-tier
 *     egress at minimum).
 *
 * Severity mapping (`low | med | high`):
 *
 *   - `error`   → high
 *   - `deny`    → med  (intentional block; less urgent than `error`
 *                      but still attention-worthy)
 *   - `redact_required` → low (policy did its job; informational)
 *   - `allow` + restricted-tier → med
 *   - everything else → low
 *
 * The `intended_tenant` / `resolved_tenant` columns described in
 * the early STRESS-P0-006 design notes do NOT exist on the
 * production `ai_egress_audit` schema today. We derive a
 * tenant-resolution mismatch indicator from `request_metadata`
 * when callers stamp `intendedTenantKey` / `resolvedTenantKey`
 * fields into the metadata JSON; if neither is present, we
 * conservatively report "no observed mismatch" rather than a
 * false negative. This keeps the chip honest until the schema
 * grows first-class columns.
 *
 * RLS coverage % — there is no programmatic helper yet to compute
 * RLS-policy coverage across tenant-scoped tables. We hardcode
 * `100` and force `evidence: 'estimated'` regardless of query
 * success, so the Trust strip Isolation chip reads honestly
 * ("estimated" in muted text) until a real coverage probe lands
 * in Wave 3.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md): if we
 * cannot tell whether isolation is intact, the chip MUST NOT read
 * green-live. We surface 'estimated' until at least the RLS
 * coverage probe is real.
 *
 * Broker-boundary doctrine: this file is inside
 * `src/lib/admin/broker/**` and is therefore the canonical zone
 * where direct data reads via the `azureRead` adapter are
 * permitted (`broker-boundary.test.ts` exempts this directory).
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §4 (Persona C
 * incident-response admin), §5.4 (Data Trust backbone — isolation
 * is one of the four trust dimensions), §7 Wave 2 PR-2 for the
 * surface narrative this fulfills.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';

// ── Contract ────────────────────────────────────────────────────────────────

export type IsolationEvidence = 'live' | 'estimated';
export type IsolationSeverity = 'low' | 'med' | 'high';

export interface IsolationRecentEvent {
  id: string;
  ts: string;
  /**
   * Broker-input tenant key (kebab form, e.g. `apex-retail`). This is
   * the same string the caller passed in. We do NOT surface the raw
   * `tenant_id` UUID — that is internal plumbing.
   */
  tenantKey: string;
  /**
   * The authenticated subject the egress writer recorded. Clerk
   * subjects (`user_xxx…`). `null` for system-initiated calls.
   */
  userId: string | null;
  /**
   * Best-effort signal that the call's intended tenant differs from
   * the tenant the egress writer attached the row to. Sourced from
   * `request_metadata.intendedTenantKey` if the caller stamped it.
   * `null` when no stamp exists — we do NOT guess.
   */
  intendedTenant: string | null;
  /**
   * The tenant the egress writer actually resolved. Same source as
   * `intendedTenant`; `request_metadata.resolvedTenantKey`. `null`
   * when no stamp exists.
   */
  resolvedTenant: string | null;
  severity: IsolationSeverity;
  /**
   * True when this row warrants the "anomaly" badge. The flag is
   * derived from policy_decision + error_message + data_class per
   * the rules at the top of this file.
   */
  anomaly: boolean;
  /**
   * Plain-language reason the row drew attention. Sourced from the
   * `decision_reason` column (already plain-language by the egress
   * writer's contract) or, when absent, the `error_message`.
   */
  reason: string | null;
  /**
   * Workflow that triggered the egress (e.g. `intelligence.ask`).
   * Useful in the lane table without exposing payload content.
   */
  workflow: string;
  /**
   * AI provider name (e.g. `anthropic`, `openai`). Metadata-safe.
   */
  provider: string;
  /**
   * Allowed / denied / redact_required / error.
   */
  policyDecision: string;
  /**
   * `public | internal | confidential | restricted`.
   */
  dataClass: string;
}

export interface IsolationPostureTopAnomaly {
  id: string;
  description: string;
  severity: IsolationSeverity;
  ts: string;
}

export interface IsolationPosture {
  rlsCoveragePct: number;
  tenantResolutionEvents24h: number;
  anomaliesLast24h: number;
  topAnomaly: IsolationPostureTopAnomaly | null;
  recentEvents: IsolationRecentEvent[];
  /**
   * Per-row evidence flag. `'live'` when we successfully read the
   * `ai_egress_audit` window AND the RLS coverage probe is real.
   * `'estimated'` otherwise. Today, the RLS probe is hardcoded,
   * so this field will ALWAYS resolve to `'estimated'` until a
   * real probe lands. That is intentional — see honesty doctrine
   * at the top of this file.
   */
  evidence: IsolationEvidence;
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Lookback window for the lane and the chip. */
const ISOLATION_WINDOW_HOURS = 24;

/** Max rows we surface to the lane table. The chip uses counts only. */
const RECENT_EVENTS_LIMIT = 50;

/**
 * RLS coverage is hardcoded today because there is no helper that
 * inspects `pg_policies` and computes the % of tenant-scoped tables
 * with at least one tenant-isolation policy. Until that probe is
 * written, this is an explicit "we don't know" surfaced via
 * `evidence: 'estimated'`. Do NOT lift this without also wiring a
 * real probe AND removing the unconditional `'estimated'` flag below.
 */
// TODO(Wave 3): compute rlsCoveragePct from a real pg_policies probe
// and flip `evidence` to 'live' when the probe + ai_egress_audit
// read both succeed.
const RLS_COVERAGE_PCT_HARDCODED = 100;

// ── Row shape from the ai_egress_audit query ────────────────────────────────

interface EgressAuditRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  workflow: string;
  provider: string;
  model: string | null;
  route: string;
  data_class: string;
  policy_decision: string;
  decision_reason: string;
  request_metadata: unknown;
  error_message: string | null;
  created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function metadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Map a row to its anomaly severity. Returns `'low'` for benign rows
 * that we still surface in the table (e.g. allow + non-restricted)
 * — the `anomaly` flag tells the UI whether to badge it red.
 */
function severityFor(row: EgressAuditRow): IsolationSeverity {
  // Hard errors are the highest-signal class.
  if (row.policy_decision === 'error' || row.error_message) {
    return 'high';
  }
  if (row.policy_decision === 'deny') {
    return 'med';
  }
  if (row.data_class === 'restricted') {
    return 'med';
  }
  if (row.policy_decision === 'redact_required') {
    return 'low';
  }
  return 'low';
}

/**
 * True when the row warrants the anomaly badge. The chip count is
 * derived from this predicate, so it must stay strict — false
 * positives erode trust in the chip.
 */
function isAnomaly(row: EgressAuditRow): boolean {
  if (row.policy_decision === 'deny' || row.policy_decision === 'error') {
    return true;
  }
  if (row.error_message && row.error_message.length > 0) {
    return true;
  }
  // Tenant-resolution mismatch: callers may stamp the intended /
  // resolved tenant key in request_metadata. If both are present and
  // differ, that is a cross-tenant signal regardless of decision.
  const meta = metadataRecord(row.request_metadata);
  const intended = stringOrNull(meta.intendedTenantKey);
  const resolved = stringOrNull(meta.resolvedTenantKey);
  if (intended && resolved && intended !== resolved) {
    return true;
  }
  // Restricted-tier egress is informational, NOT an anomaly by
  // itself. We only badge the row anomalous if it was denied,
  // errored, or showed a tenant mismatch.
  return false;
}

function reasonFor(row: EgressAuditRow): string | null {
  if (row.decision_reason && row.decision_reason.length > 0) {
    return row.decision_reason;
  }
  return stringOrNull(row.error_message);
}

function severityRank(s: IsolationSeverity): number {
  return s === 'high' ? 3 : s === 'med' ? 2 : 1;
}

function pickTopAnomaly(
  events: ReadonlyArray<IsolationRecentEvent>,
): IsolationPostureTopAnomaly | null {
  const anomalies = events.filter((e) => e.anomaly);
  if (anomalies.length === 0) return null;
  const sorted = [...anomalies].sort((a, b) => {
    const sevDiff = severityRank(b.severity) - severityRank(a.severity);
    if (sevDiff !== 0) return sevDiff;
    const ta = Date.parse(a.ts);
    const tb = Date.parse(b.ts);
    const va = Number.isFinite(ta) ? ta : -Infinity;
    const vb = Number.isFinite(tb) ? tb : -Infinity;
    return vb - va;
  });
  const top = sorted[0];
  // Description is a plain-language line — reason if present, else a
  // generic anomaly label.
  const description =
    top.reason ?? `${top.policyDecision} · ${top.workflow}`;
  return {
    id: top.id,
    description,
    severity: top.severity,
    ts: top.ts,
  };
}

function mapRow(row: EgressAuditRow, tenantKey: string): IsolationRecentEvent {
  const meta = metadataRecord(row.request_metadata);
  return {
    id: row.id,
    ts: row.created_at,
    tenantKey,
    userId: stringOrNull(row.user_id),
    intendedTenant: stringOrNull(meta.intendedTenantKey),
    resolvedTenant: stringOrNull(meta.resolvedTenantKey),
    severity: severityFor(row),
    anomaly: isAnomaly(row),
    reason: reasonFor(row),
    workflow: row.workflow,
    provider: row.provider,
    policyDecision: row.policy_decision,
    dataClass: row.data_class,
  };
}

function isoWindowStart(): string {
  return new Date(
    Date.now() - ISOLATION_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

function fallbackEstimated(): IsolationPosture {
  return {
    rlsCoveragePct: RLS_COVERAGE_PCT_HARDCODED,
    tenantResolutionEvents24h: 0,
    anomaliesLast24h: 0,
    topAnomaly: null,
    recentEvents: [],
    evidence: 'estimated',
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Compose the isolation posture for one tenant.
 *
 * @param tenantKey — kebab-form tenant slug (e.g. `apex-retail`). The
 *   broker resolves this to the `clients.id` UUID via
 *   `resolveClientId` before querying `ai_egress_audit`. Per
 *   `feedback_broker_boundary.md`, the caller is responsible for
 *   passing the broker-side slug, not the app ClientKey.
 *
 * Errors are caught here — this broker is graceful by design. If
 * the tenant cannot be resolved or the underlying query fails, the
 * broker returns the estimated fallback shape with a structured
 * console.warn so the upstream trust-spine can render the chip
 * honestly (rather than crashing the landing).
 */
export async function getIsolationPosture(
  tenantKey: string,
): Promise<IsolationPosture> {
  let clientId: string | null = null;
  try {
    clientId = await resolveClientId(tenantKey);
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'isolation_posture.client_resolve_failed',
        tenantKey,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return fallbackEstimated();
  }

  if (!clientId) {
    // Honest empty case: we asked, no client row. Surface zeros and
    // mark estimated (the RLS probe is hardcoded regardless).
    return fallbackEstimated();
  }

  let rows: EgressAuditRow[] = [];
  try {
    rows = await azureRead.select<EgressAuditRow>({
      table: 'ai_egress_audit',
      // EXPLICIT column allow-list. We never select prompt_hash,
      // response_hash, prompt_snapshot_ref, response_snapshot_ref —
      // those are payload-fingerprint columns that have no place in
      // an admin lane. PII / payload material stays in the row
      // store; the broker yields metadata only.
      columns: [
        'id',
        'tenant_id',
        'user_id',
        'workflow',
        'provider',
        'model',
        'route',
        'data_class',
        'policy_decision',
        'decision_reason',
        'request_metadata',
        'error_message',
        'created_at',
      ],
      where: {
        tenant_id: clientId,
        created_at: { op: 'gte', value: isoWindowStart() },
      },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: RECENT_EVENTS_LIMIT,
      missingTable: 'empty',
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'isolation_posture.audit_query_failed',
        tenantKey,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return fallbackEstimated();
  }

  const recentEvents = rows.map((r) => mapRow(r, tenantKey));
  const tenantResolutionEvents24h = recentEvents.length;
  const anomaliesLast24h = recentEvents.filter((e) => e.anomaly).length;
  const topAnomaly = pickTopAnomaly(recentEvents);

  return {
    rlsCoveragePct: RLS_COVERAGE_PCT_HARDCODED,
    tenantResolutionEvents24h,
    anomaliesLast24h,
    topAnomaly,
    recentEvents,
    // RLS coverage % is hardcoded → mark estimated regardless of
    // query success. Honesty doctrine: we don't fake live until
    // EVERY input is real.
    evidence: 'estimated',
  };
}
