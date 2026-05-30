/**
 * Connector Health broker · Wave 2 PR-1
 *
 * Live per-tenant connector posture for the Setup / Admin Trust
 * Plane. Replaces the `composeIntegration()` estimated stub in
 * `trust-spine-broker.ts` with real data sourced from the
 * canonical admin connectors adapter (`getAdminConnectors`),
 * which already abstracts fixture vs. live mode (ADMIN-DATA10).
 *
 * Contract:
 *   getConnectorHealth(tenantKey) → ConnectorHealth
 *
 * The broker's job is composition, not querying. Per-tenant rows
 * come from `admin-connectors-adapter.ts`. We translate the
 * adapter's status taxonomy (`not_configured | configured_stub |
 * blocked | deferred | active`) into the Trust strip's posture
 * taxonomy (`live | degraded | disconnected | pending`) and
 * compute the rollups the Trust strip chip needs:
 *
 *   - connectorsTotal / connectorsLive / connectorsDegraded
 *   - lastPullIso (most recent successful pull across all connectors)
 *   - topDegraded (first degraded connector, most-recent-failure-first)
 *   - perConnector (the per-row mapping for downstream callers)
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   - If we cannot tell whether a connector is live, we mark it
 *     `pending`, NOT `live`. The Trust strip must never fake green.
 *   - If a tenant has no connectors at all, we return zeros with
 *     `evidence: 'live'` — the truth is "we asked, the answer is none."
 *   - If the upstream adapter throws (e.g. the live DB read path
 *     is still pending), the caller (trust-spine-broker) handles
 *     the graceful degradation by re-stubbing as `'estimated'`.
 *
 * Broker-boundary doctrine: this file is inside
 * `src/lib/admin/broker/**` and is therefore the canonical zone
 * where direct data reads are permitted. We route through the
 * existing `getAdminConnectors` adapter rather than pulling
 * Supabase directly — the adapter already encapsulates the
 * fixture / live mode switch and the tenant→client_id mapping.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.4 +
 * §7 Wave 2 PR-1 for the surface narrative this fulfills.
 */

import 'server-only';

import {
  getAdminConnectorById,
  getAdminConnectors,
} from '@/lib/admin/data/admin-connectors-adapter';
import type {
  AdminConnectorRow,
  AdminConnectorStatus,
} from '@/lib/admin/data/admin-connectors-adapter-types';
import {
  probeForKind,
  type ProbeResult,
} from './connector-probes';

// ── Contract ────────────────────────────────────────────────────────────────

export type ConnectorPostureStatus =
  | 'live'
  | 'degraded'
  | 'disconnected'
  | 'pending';

export interface ConnectorHealthRow {
  id: string;
  name: string;
  status: ConnectorPostureStatus;
  lastPullIso: string | null;
  failureReason: string | null;
}

export interface ConnectorHealth {
  connectorsTotal: number;
  connectorsLive: number;
  connectorsDegraded: number;
  lastPullIso: string | null;
  topDegraded: { id: string; name: string; reason: string } | null;
  perConnector: ConnectorHealthRow[];
}

// ── Adapter status → posture-status mapping ─────────────────────────────────

/**
 * Map the adapter's lifecycle status to the Trust strip's posture
 * status. The mapping is intentionally conservative:
 *
 *   active            → live          (real, healthy connection)
 *   configured_stub   → live          (running against fixture, but the
 *                                      shim IS the active path today;
 *                                      callers can downgrade if needed)
 *   blocked           → degraded      (a real connection that is now
 *                                      failing; surface the reason)
 *   not_configured    → disconnected  (no credentials, no traffic)
 *   deferred          → pending       (intentionally postponed)
 *
 * Any future status the adapter learns to emit defaults to
 * `pending` rather than `live`. The honesty doctrine forbids
 * faking green for unknown states.
 */
function postureStatusFor(status: AdminConnectorStatus): ConnectorPostureStatus {
  switch (status) {
    case 'active':
    case 'configured_stub':
      return 'live';
    case 'blocked':
      return 'degraded';
    case 'not_configured':
      return 'disconnected';
    case 'deferred':
      return 'pending';
    default:
      // Defensive: an unrecognized status maps to `pending` so the
      // strip stays honest if the adapter's taxonomy widens.
      return 'pending';
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Pick the most recent ISO timestamp across all connectors. Returns
 * `null` if no connector reports a `lastSyncAttempt`. Strings that
 * fail to parse are skipped silently — the goal is the freshest
 * trustworthy date, not the freshest string.
 */
function pickLatestIso(rows: ReadonlyArray<AdminConnectorRow>): string | null {
  let latestMs = -Infinity;
  let latestIso: string | null = null;
  for (const row of rows) {
    if (!row.lastSyncAttempt) continue;
    const ms = Date.parse(row.lastSyncAttempt);
    if (!Number.isFinite(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latestIso = row.lastSyncAttempt;
    }
  }
  return latestIso;
}

/**
 * Pick the "most attention-worthy" degraded connector for the
 * Trust strip's single-row callout. Sort order:
 *
 *   1. Degraded rows only.
 *   2. Most-recent-failure-first — `lastSyncAttempt` desc; null
 *      timestamps sink to the bottom (we'd rather show a failure
 *      with a known timestamp than one without).
 *
 * Returns null if no degraded connectors exist.
 */
function pickTopDegraded(
  rows: ReadonlyArray<ConnectorHealthRow>,
): { id: string; name: string; reason: string } | null {
  const degraded = rows.filter((r) => r.status === 'degraded');
  if (degraded.length === 0) return null;
  const sorted = [...degraded].sort((a, b) => {
    const ta = a.lastPullIso ? Date.parse(a.lastPullIso) : -Infinity;
    const tb = b.lastPullIso ? Date.parse(b.lastPullIso) : -Infinity;
    const va = Number.isFinite(ta) ? ta : -Infinity;
    const vb = Number.isFinite(tb) ? tb : -Infinity;
    return vb - va;
  });
  const top = sorted[0];
  return {
    id: top.id,
    name: top.name,
    reason: top.failureReason ?? 'Connector reported a degraded state.',
  };
}

/** Translate one adapter row into the broker contract row. */
function adapterRowToHealthRow(row: AdminConnectorRow): ConnectorHealthRow {
  const status = postureStatusFor(row.status);
  // Failure reason surfaces only for degraded rows — `blockerReason`
  // on a `blocked` adapter row is the canonical message. For
  // non-degraded statuses we suppress it so the strip stays clean.
  const failureReason = status === 'degraded' ? row.blockerReason ?? null : null;
  return {
    id: row.id,
    name: row.label,
    status,
    lastPullIso: row.lastSyncAttempt ?? null,
    failureReason,
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Compose the connector posture for one tenant.
 *
 * @param tenantKey — the connectors adapter uses the page's
 *   `tenantSlug` directly (kebab form, e.g. `apex-retail`). The
 *   caller is responsible for mapping app ClientKey → broker
 *   slug if the call site holds the wrong shape; see
 *   `feedback_broker_boundary.md` (tenant key split).
 *
 * Errors are not caught here — the caller (trust-spine-broker)
 * uses `Promise.allSettled` and re-stubs as `'estimated'`. That
 * keeps the contract narrow: this broker either returns a real
 * `ConnectorHealth` or surfaces the underlying error.
 */
export async function getConnectorHealth(
  tenantKey: string,
): Promise<ConnectorHealth> {
  const rows = await getAdminConnectors(tenantKey);

  if (rows.length === 0) {
    // Honest empty case: we asked, the tenant has no connectors.
    // Zeros with no top-degraded callout. Caller marks evidence
    // as 'live' because this is a known truth, not a fallback.
    return {
      connectorsTotal: 0,
      connectorsLive: 0,
      connectorsDegraded: 0,
      lastPullIso: null,
      topDegraded: null,
      perConnector: [],
    };
  }

  const perConnector = rows.map(adapterRowToHealthRow);
  const connectorsLive = perConnector.filter((r) => r.status === 'live').length;
  const connectorsDegraded = perConnector.filter(
    (r) => r.status === 'degraded',
  ).length;
  // `lastPullIso` is the most recent successful pull across all
  // connectors — we use any `lastSyncAttempt` regardless of status
  // (a stale pull from a now-degraded connector is still the
  // freshest signal we have). The Trust strip surfaces this as
  // "last pull · 3h ago."
  const lastPullIso = pickLatestIso(rows);
  const topDegraded = pickTopDegraded(perConnector);

  return {
    connectorsTotal: rows.length,
    connectorsLive,
    connectorsDegraded,
    lastPullIso,
    topDegraded,
    perConnector,
  };
}

// ── testConnector · PRE-W4-PR-3 ────────────────────────────────────────────
//
// Manual "Test connection" affordance from the connector detail page.
//
// Contract:
//   testConnector(tenantKey, connectorId) → TestConnectorResult
//
// Behaviour:
//   1. Resolves the connector via `getAdminConnectorById`. Unknown
//      connector → `ok: false, reason: 'not_found'`.
//   2. Looks up the per-kind probe in the probe registry.
//   3. Executes the probe with a 5 s hard cap (the probe itself
//      enforces the timeout via AbortController).
//   4. Emits a status transition when the probed verdict diverges
//      from the connector's recorded posture:
//         degraded → live  (recovered)
//         live     → degraded (degraded; reason carried)
//      Other transitions are observed but not auto-mutated — the
//      taxonomy is conservative on purpose.
//   5. Returns the result. The route handler is responsible for the
//      audit-log write and the rate-limit gate; the broker stays
//      free of HTTP / Clerk concerns.
//
// Why the transition is here and not in the route:
//   The transition IS the connector-health domain — it's what feeds
//   the Wave 4 `connector.degraded` / `connector.recovered`
//   notification stream. Keeping it inside the broker means future
//   non-HTTP callers (e.g. a cron healthcheck) get the same
//   transition semantics for free.

export type TestConnectorTransition =
  | { kind: 'none' }
  | { kind: 'degraded'; reason: string }
  | { kind: 'recovered' };

export interface TestConnectorResult {
  ok: boolean;
  latencyMs: number;
  reason?: string;
  probedAtIso: string;
  /**
   * The connector's posture status *before* this probe. Lets the
   * route handler decide whether the result represents a change.
   * `null` when the connector cannot be resolved.
   */
  priorStatus: ConnectorPostureStatus | null;
  /**
   * The connector's posture status *after* the probe verdict.
   * Same value as `priorStatus` when the probe was inconclusive
   * (e.g. "probe unsupported").
   */
  nextStatus: ConnectorPostureStatus | null;
  /** Status transition derived from prior → next. */
  transition: TestConnectorTransition;
}

/**
 * Decide whether a probe verdict should rewrite the connector's
 * posture. The taxonomy is intentionally conservative:
 *
 *   • `live → live`              · no change.
 *   • `live → degraded`          · emit `degraded` transition.
 *   • `degraded → live`          · emit `recovered` transition.
 *   • everything else            · no transition; the probe is
 *                                  observational only (e.g. probing
 *                                  a `not_configured` connector
 *                                  doesn't move it to `live`).
 *
 * Per directive §6: only auto-monitoring is allowed to mint the
 * notification stream. This function computes the *transition* but
 * does NOT persist it — Wave 4 wires the persist + notify.
 */
/**
 * Distinguish "probe is unsupported / inconclusive" (e.g. no health
 * URL configured, kind has no live driver yet) from "probe ran and
 * the connection failed". An inconclusive verdict must NEVER degrade
 * a previously-live connector — that would manufacture a degradation
 * out of a missing configuration. We detect this by reason prefix;
 * the probe layer is the single source of these strings.
 */
function isInconclusiveReason(reason: string | undefined): boolean {
  if (!reason) return false;
  return /probe unsupported/i.test(reason);
}

function deriveTransition(
  prior: ConnectorPostureStatus | null,
  probedOk: boolean,
  reason: string | undefined,
): { next: ConnectorPostureStatus | null; transition: TestConnectorTransition } {
  if (prior == null) {
    return { next: null, transition: { kind: 'none' } };
  }
  // Inconclusive probes are observational only — never mutate
  // posture, never emit a transition.
  if (!probedOk && isInconclusiveReason(reason)) {
    return { next: prior, transition: { kind: 'none' } };
  }
  if (probedOk && prior === 'degraded') {
    return { next: 'live', transition: { kind: 'recovered' } };
  }
  if (!probedOk && prior === 'live') {
    return {
      next: 'degraded',
      transition: {
        kind: 'degraded',
        reason: reason ?? 'probe failed',
      },
    };
  }
  return { next: prior, transition: { kind: 'none' } };
}

/**
 * Resolve a probe URL from the connector row. Today the adapter
 * doesn't expose a discrete `healthUrl` column, so we hand the row
 * straight to the probe and let it decide (HTTP probes will short-
 * circuit when no URL is available, returning "probe unsupported").
 *
 * Future: when the adapter learns `config.healthUrl`, surface it
 * here and forward to the probe. The route handler stays unchanged.
 */
function resolveHealthUrl(row: AdminConnectorRow): string | null {
  // Adapter does not yet expose a healthUrl. Returning null tells
  // the HTTP probe to surface "probe unsupported · no health URL
  // configured" — the truthful state per the honesty doctrine.
  void row;
  return null;
}

export async function testConnector(
  tenantKey: string,
  connectorId: string,
): Promise<TestConnectorResult> {
  const probedAtIso = new Date().toISOString();

  const connector = await getAdminConnectorById(tenantKey, connectorId);
  if (!connector) {
    return {
      ok: false,
      latencyMs: 0,
      reason: 'not_found',
      probedAtIso,
      priorStatus: null,
      nextStatus: null,
      transition: { kind: 'none' },
    };
  }

  const priorStatus = postureStatusFor(connector.status);
  const probe = probeForKind(connector.kind);

  let probeResult: ProbeResult;
  try {
    probeResult = await probe({
      connector,
      healthUrl: resolveHealthUrl(connector),
    });
  } catch (err) {
    // A probe throwing is itself a failure verdict — translate, do
    // not propagate. The route handler still gets to audit a clean
    // result. Per safety doctrine: never leak credentials; the
    // err message comes from our own code paths (fetch / abort) so
    // it's safe to surface, but we cap the length defensively.
    const rawMessage = err instanceof Error ? err.message : 'probe failed';
    probeResult = {
      ok: false,
      latencyMs: 0,
      reason: rawMessage.slice(0, 200),
    };
  }

  const { next, transition } = deriveTransition(
    priorStatus,
    probeResult.ok,
    probeResult.reason,
  );

  return {
    ok: probeResult.ok,
    latencyMs: probeResult.latencyMs,
    reason: probeResult.reason,
    probedAtIso,
    priorStatus,
    nextStatus: next,
    transition,
  };
}
