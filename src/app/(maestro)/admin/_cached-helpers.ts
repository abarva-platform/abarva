/**
 * Admin Overview · per-request broker caches with structured error
 * logging.
 *
 * Extracted from `src/app/(maestro)/admin/page.tsx` in PR-2613 (P0
 * follow-up to PR-2606) so the bare `catch { return null }` swallows
 * that hid real broker failures behind "0 / no data yet" UI states
 * become testable.
 *
 * Each helper:
 *   1. Calls its broker once per request (React.cache dedupes within
 *      the same request).
 *   2. Returns the safe fallback (null / []) on failure so the page
 *      never crashes.
 *   3. Emits a structured JSON `console.warn` so Vercel function
 *      logs carry the actual error message + tenantKey + first 3
 *      stack frames.
 *
 * Without (3), founders + ops staff have to guess at why the trust
 * strip rendered empty in production — that was the symptom that
 * triggered PR-2613 in the first place.
 */

import 'server-only';

import { cache } from 'react';

import {
  getCrossProgramSignals,
  getSetupInventorySnapshot,
} from '@/lib/admin/setup-data-broker';
import { getTrustSpine } from '@/lib/admin/broker/trust-spine-broker';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';

/**
 * Emit a structured JSON warn for a broker failure on the admin
 * landing. Single seam so all four caches log in the same shape.
 *
 * Shape:
 *   { event, tenantKey, error, stack: [first 3 frames] }
 *
 * `event` is the canonical correlation id ops greps for in Vercel
 * logs (e.g. `admin_page.cached_inventory_snapshot_failed`).
 */
export function logBrokerFailure(
  event: string,
  tenantKey: string | null,
  err: unknown,
): void {
  const e = err as Error;
  console.warn(
    JSON.stringify({
      event,
      tenantKey,
      error: e?.message ?? String(err),
      stack: e?.stack?.split('\n').slice(0, 3),
    }),
  );
}

export const cachedInventorySnapshot = cache(
  async (tenantKey: string | null) => {
    if (!tenantKey) return null;
    try {
      return await getSetupInventorySnapshot(tenantKey);
    } catch (e) {
      logBrokerFailure(
        'admin_page.cached_inventory_snapshot_failed',
        tenantKey,
        e,
      );
      return null;
    }
  },
);

// Browser walk 2026-05-30 P0 #1 — TrustSpine and the page's own
// inventory snapshot used to issue two independent calls to
// `getSetupInventorySnapshot`. When the trust-spine call rejected
// silently (intermittent DB blip, connection limit, etc.), the
// substrate dimension fell back to 0 segments — making the Trust
// strip and posture grid render an empty tenant even though the
// masthead pills (which read the page-cached snapshot) showed the
// real count. Threading the cached snapshot through eliminates the
// divergence at source. PR-2606.
export const cachedTrustSpine = cache(async (tenantKey: string | null) => {
  if (!tenantKey) return null;
  try {
    const snapshot = await cachedInventorySnapshot(tenantKey);
    return await getTrustSpine(tenantKey, { snapshotOverride: snapshot });
  } catch (e) {
    logBrokerFailure('admin_page.cached_trust_spine_failed', tenantKey, e);
    return null;
  }
});

export const cachedCrossProgramSignals = cache(
  async (tenantKey: string | null) => {
    if (!tenantKey) return [];
    try {
      return await getCrossProgramSignals(tenantKey);
    } catch (e) {
      logBrokerFailure(
        'admin_page.cached_cross_program_signals_failed',
        tenantKey,
        e,
      );
      return [];
    }
  },
);

export const cachedApprovalQueue = cache(async (clientKey: string) => {
  try {
    return await getApprovalQueueForTenant(clientKey);
  } catch (e) {
    logBrokerFailure(
      'admin_page.cached_approval_queue_failed',
      clientKey,
      e,
    );
    return [];
  }
});
