/**
 * Connector Probes · PRE-W4-PR-3
 *
 * Per-kind probe strategies for the "Test connection" affordance.
 * Centralises the lookup from `AdminConnectorKind` → probe function
 * so the broker stays declarative and the route handler stays thin.
 *
 * Safety contract (must hold for every probe):
 *
 *   1. Hard 5 s timeout. The probe MUST return within 5 s wall-clock
 *      so the route handler never hangs.
 *   2. No OAuth flows. Probes use only the connector's *existing*
 *      stored configuration. If credentials are missing they return
 *      `ok: false, reason: 'configure auth first'`.
 *   3. No retries. A single attempt; failures are reported, not
 *      papered over.
 *   4. No credentials in the result payload. `reason` carries
 *      operator-facing text only — never tokens, never secrets.
 *
 * Probe strategy by kind:
 *
 *   - HTTP-based connectors (CRM, market intel, vendor portal,
 *     contract management, identity, "other"): GET a documented
 *     health URL. We treat 2xx/3xx as healthy; 4xx as auth-error;
 *     5xx as degraded. No URL → "probe unsupported".
 *   - DB connectors (`data_warehouse`): we never connect at probe
 *     time. Probes that need DB credentials return "probe unsupported
 *     · configure auth first" until a live DB driver is wired.
 *     This is the safe default per #5 in the directive.
 *   - ERP / spend analytics: HTTP if a health URL is configured,
 *     otherwise "probe unsupported."
 *
 * The broker never executes a destructive operation. Probes are
 * read-only by construction — GET, never POST/PUT/DELETE.
 */

import 'server-only';

import type { AdminConnectorKind, AdminConnectorRow } from '@/lib/admin/data/admin-connectors-adapter-types';

const PROBE_TIMEOUT_MS = 5_000;

export interface ProbeResult {
  ok: boolean;
  latencyMs: number;
  reason?: string;
}

export interface ProbeInput {
  connector: AdminConnectorRow;
  /**
   * Optional probe URL. The broker resolves this from the per-tenant
   * connector config (if any) — passed in rather than read here so
   * the probe layer stays pure and easy to unit-test.
   */
  healthUrl?: string | null;
}

export type ProbeFn = (input: ProbeInput) => Promise<ProbeResult>;

/**
 * Wraps `fetch` with a hard timeout via AbortController. Returns
 * `{ ok, status, latencyMs, errorMessage }` and never throws — the
 * caller decides how to translate that into a ProbeResult.
 */
async function httpHead(url: string): Promise<{
  ok: boolean;
  status: number;
  latencyMs: number;
  errorMessage?: string;
}> {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      // Per safety rule: no retries. fetch has none by default.
      // Per safety rule: no follow-on calls.
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        // Identify the probe so downstream log analytics can filter.
        'user-agent': 'AbarVa-ConnectorProbe/1.0',
        accept: '*/*',
      },
    });
    const latencyMs = Date.now() - start;
    return { ok: res.ok, status: res.status, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      latencyMs,
      errorMessage: aborted
        ? `probe timed out after ${PROBE_TIMEOUT_MS}ms`
        : err instanceof Error
        ? err.message
        : 'probe failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HTTP probe — GET a configured health URL, treat 2xx/3xx as healthy.
 * Buckets the failure modes into operator-readable reasons.
 */
const httpProbe: ProbeFn = async ({ healthUrl }) => {
  if (!healthUrl) {
    return {
      ok: false,
      latencyMs: 0,
      reason: 'probe unsupported · no health URL configured',
    };
  }
  const res = await httpHead(healthUrl);
  if (res.ok) {
    return { ok: true, latencyMs: res.latencyMs };
  }
  if (res.errorMessage) {
    return { ok: false, latencyMs: res.latencyMs, reason: res.errorMessage };
  }
  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      latencyMs: res.latencyMs,
      reason: `auth-error · HTTP ${res.status} · reconnect connector`,
    };
  }
  if (res.status >= 400 && res.status < 500) {
    return {
      ok: false,
      latencyMs: res.latencyMs,
      reason: `client-error · HTTP ${res.status}`,
    };
  }
  if (res.status >= 500) {
    return {
      ok: false,
      latencyMs: res.latencyMs,
      reason: `server-error · HTTP ${res.status}`,
    };
  }
  return {
    ok: false,
    latencyMs: res.latencyMs,
    reason: `unexpected HTTP ${res.status}`,
  };
};

/**
 * Default probe for connector kinds that have no safe live probe
 * available today (DB-based warehouses, anything requiring a
 * non-HTTP driver). Returns "probe unsupported" with a hint so the
 * UI can surface the next step.
 */
const unsupportedProbe: ProbeFn = async ({ connector }) => ({
  ok: false,
  latencyMs: 0,
  reason: `probe unsupported for ${connector.kind} connectors · configure auth first`,
});

/**
 * Per-kind probe registry. Adding a new kind:
 *   1. Extend AdminConnectorKind in admin-connectors-adapter-types.ts.
 *   2. Register the strategy here.
 *   3. Add a unit test covering the new branch.
 */
const PROBE_BY_KIND: Readonly<Record<AdminConnectorKind, ProbeFn>> = {
  erp: httpProbe,
  spend_analytics: httpProbe,
  contract_management: httpProbe,
  market_intelligence: httpProbe,
  vendor_portal: httpProbe,
  identity: httpProbe,
  crm: httpProbe,
  // DB-based — no safe live probe until a managed driver is wired.
  data_warehouse: unsupportedProbe,
  other: httpProbe,
};

export function probeForKind(kind: AdminConnectorKind): ProbeFn {
  return PROBE_BY_KIND[kind] ?? unsupportedProbe;
}

/**
 * Test-only export. The route handler should call `probeForKind`
 * and execute it — this helper exists so unit tests can assert that
 * every adapter kind has an entry without leaking the table shape.
 */
export function probeKindsRegistered(): ReadonlyArray<AdminConnectorKind> {
  return Object.keys(PROBE_BY_KIND) as ReadonlyArray<AdminConnectorKind>;
}

export const PROBE_TIMEOUT_MS_EXPORT = PROBE_TIMEOUT_MS;
