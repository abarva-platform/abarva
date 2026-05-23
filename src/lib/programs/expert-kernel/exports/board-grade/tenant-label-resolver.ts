// Board-grade renderer tenant-label resolver.
//
// P1-3 (synthetic pilot rehearsal, 2026-05-22): the eight Move board-grade
// model files used to compute `tenantLabel: skeleton.tenantKey`. The skeleton's
// `tenantKey` is derived in `buildMoveBusinessCase` as `identity?.industryKey
// ?? 'unknown-tenant'` — the FUNCTION-PACK industry slug (e.g. `'retail'`).
// So a rendered Move would label the deck `retail · customer-care` instead of
// `Apex Retail · customer-care`, and a brand-new tenant (Northwind) would
// also show `retail`.
//
// This module resolves the right tenant LABEL (display name) from the inputs
// the model already has — the Move row's tenant key/name when threaded through
// `loadMoveBusinessCaseInput`, falling back through:
//
//   1. canonical client display name from `client-config.canonicalClientDisplayName`
//      keyed by `move.tenant_key`/`move.tenantKey` (canonical) or
//      `move.tenant_name`/`move.tenantName` (DB row)
//   2. the raw `move.tenant_name` if it is set and non-empty (a real tenant
//      name we just haven't canonicalised — better than an honest placeholder)
//   3. the honest "Tenant" placeholder
//
// HONESTY DISCIPLINE: this resolver MUST NOT fall back to the industry slug
// ("retail", "healthcare-provider", "financial-services"). That was the bug;
// the placeholder is honestly generic instead.

import { ALL_CLIENTS, canonicalClientDisplayName } from '@/lib/client-config';
import type { MoveBusinessCaseInput } from '../../../move-business-case';

/** The honest fallback when no tenant key or name resolves. */
const TENANT_PLACEHOLDER = 'Tenant';

/**
 * Lowercase set of recognised ClientKeys plus their canonical aliases.
 * `canonicalClientDisplayName` accepts e.g. `'firstcapital'` as well as
 * `'arcturus'` for the same tenant; both must be treated as recognised.
 */
const RECOGNISED_CLIENT_KEYS = new Set<string>([
  ...ALL_CLIENTS.map((c) => c.id.toLowerCase()),
  'firstcapital',
  'first-capital',
]);

function isRecognisedClientKey(key: string): boolean {
  return RECOGNISED_CLIENT_KEYS.has(key.toLowerCase());
}

/**
 * Resolve the board-grade renderer tenant-label fields for a Move input.
 *
 * Returns `{ tenantLabel, tenantKey }`:
 *  - `tenantLabel` is the human-readable display name (e.g. "Apex Retail").
 *  - `tenantKey` is the canonical ClientKey if we resolved one, else the
 *    skeleton-derived industry slug (passed in by the caller) — kept stable
 *    so existing telemetry/cache keys do not move.
 *
 * The caller passes the kernel-derived industry-slug `skeletonTenantKey` so
 * we can preserve it as the `tenantKey` field when no real client key resolves,
 * but we NEVER use it as the `tenantLabel` — that was the P1-3 bug.
 */
export function resolveBoardGradeTenantLabel(
  move: MoveBusinessCaseInput,
  skeletonTenantKey: string,
): { tenantLabel: string; tenantKey: string } {
  // (1) Threaded tenant identity from `loadMoveBusinessCaseInput`.
  const threadedKey =
    typeof move.tenant_key === 'string' && move.tenant_key.trim()
      ? move.tenant_key.trim()
      : typeof move.tenantKey === 'string' && move.tenantKey.trim()
        ? move.tenantKey.trim()
        : null;
  const threadedName =
    typeof move.tenant_name === 'string' && move.tenant_name.trim()
      ? move.tenant_name.trim()
      : typeof move.tenantName === 'string' && move.tenantName.trim()
        ? move.tenantName.trim()
        : null;

  // (2) When the threaded key is one of the recognised ClientKeys, run the
  // canonical-display-name resolution — it handles every aliased form
  // ('arcturus' vs 'firstcapital' vs 'first-capital' for First Capital, the
  // retired 'Heliara'/'Brindlemark' demo names, etc.).
  if (threadedKey && isRecognisedClientKey(threadedKey)) {
    const canonical = canonicalClientDisplayName({
      key: threadedKey,
      name: threadedName,
    });
    if (canonical) {
      return {
        tenantLabel: canonical,
        tenantKey: threadedKey,
      };
    }
  }

  // (3) The threaded name alone can still resolve to a canonical client —
  // e.g. a DB row that carries `name='Meridian Health System'` without a key.
  // Run the resolver against the name only and trust it when it returns a
  // recognised mapping (the resolver's name-only branch is exact-match against
  // a known alias).
  if (threadedName) {
    const canonical = canonicalClientDisplayName({ key: null, name: threadedName });
    // `canonicalClientDisplayName` falls through to `getClientOption(null)`
    // when neither key nor name matches a known mapping — that returns the
    // DEFAULT_CLIENT_KEY ('apexretail'). To avoid silently relabelling an
    // unknown tenant as Apex Retail Group, only trust `canonical` when it
    // matches the threaded name (the resolver short-circuited on `if (name)`)
    // OR is a known canonical mapping.
    if (canonical && canonical.trim() && canonical.trim() === threadedName) {
      return { tenantLabel: threadedName, tenantKey: skeletonTenantKey };
    }
    if (
      canonical === 'Meridian Health' ||
      canonical === 'First Capital Financial' ||
      canonical === 'Apex Retail Group'
    ) {
      return { tenantLabel: canonical, tenantKey: skeletonTenantKey };
    }
    // Otherwise the resolver fell through to the default; trust the raw
    // threaded name instead — better than the placeholder.
    return { tenantLabel: threadedName, tenantKey: skeletonTenantKey };
  }

  // (4) Honest placeholder. NEVER the industry slug.
  return {
    tenantLabel: TENANT_PLACEHOLDER,
    tenantKey: skeletonTenantKey,
  };
}
