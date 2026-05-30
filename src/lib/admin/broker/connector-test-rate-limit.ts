/**
 * Per-tenant rate limit for `POST /api/admin/connectors/[id]/test`
 * (PRE-W4-PR-3).
 *
 * Hard cap: 10 probes / minute / tenant. The in-memory token bucket
 * lives at module scope — fine for the single-region runtime today,
 * a TODO for Wave 5 when we go multi-region (move to Redis / Edge
 * Config). Until then the rate-limit is best-effort *per process*;
 * a clustered deployment would multiply this by replica count, but
 * the goal is humane back-pressure on the UI, not a hard quota.
 *
 * Design notes:
 *   • Sliding window over WINDOW_MS. We keep a list of recent probe
 *     timestamps per tenant; entries older than WINDOW_MS are
 *     dropped on each `acquire()` call.
 *   • Returns `{ allowed: true }` on acceptance and
 *     `{ allowed: false, retryAfterMs }` on rejection — the route
 *     handler echoes `retryAfterMs` via the standard `Retry-After`
 *     response header.
 *   • Test affordance: `__resetRateLimit()` clears the global map
 *     so unit tests can run in isolation.
 */

const WINDOW_MS = 60_000;
const MAX_PROBES_PER_WINDOW = 10;

const recent: Map<string, number[]> = new Map();

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs?: number;
}

export function acquireConnectorTestSlot(
  tenantKey: string,
  now: number = Date.now(),
): RateLimitDecision {
  const cutoff = now - WINDOW_MS;
  const entries = recent.get(tenantKey) ?? [];
  // Drop expired entries — keeps the array bounded.
  const live = entries.filter((ts) => ts > cutoff);

  if (live.length >= MAX_PROBES_PER_WINDOW) {
    const earliest = live[0];
    const retryAfterMs = Math.max(0, earliest + WINDOW_MS - now);
    // Persist the trimmed list so subsequent calls don't keep
    // re-trimming the same stale data.
    recent.set(tenantKey, live);
    return { allowed: false, retryAfterMs };
  }

  live.push(now);
  recent.set(tenantKey, live);
  return { allowed: true };
}

/** Test-only — clear the bucket between runs. */
export function __resetConnectorTestRateLimit(): void {
  recent.clear();
}

export const CONNECTOR_TEST_RATE_LIMIT_WINDOW_MS = WINDOW_MS;
export const CONNECTOR_TEST_RATE_LIMIT_MAX = MAX_PROBES_PER_WINDOW;
