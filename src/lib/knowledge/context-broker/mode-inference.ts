import 'server-only';

/**
 * Mode inference · CB-6
 *
 * Maps a surface key + tenant-key to a default `BrokerMode`.
 * Used by `/api/chat/agent` to assemble the `ContextBundle` when
 * the client did not specify a mode.
 *
 * Per CONTEXT_BROKER_DESIGN.md §4 (Default mode per surface):
 *
 *   /programs/<id>     → 'full'    (user is in their data)
 *   /programs/new      → 'tenant'  (origination uses tenant context only)
 *   /strategic-moves/<id> and phase workspaces
 *                       → 'full'    (Move shaping needs program + tenant + corpus)
 *   /strategic-moves/new
 *                       → 'tenant'  (origination uses tenant context only)
 *   /intelligence      → 'full' when tenantKey present, else 'corpus'
 *                         (Sentinel needs tenant facts plus corpus)
 *   /tower             → 'full'    (cross-program rollup)
 *   /source            → 'full'    (tenant sourcing facts + shared corpus)
 *   /home              → 'tenant' if tenantKey present, else 'generic'
 *   cold-start (no auth, no tenantKey) → 'generic'
 *
 * Surfaces not listed default to `'tenant'` when a tenantKey is
 * available, otherwise `'generic'`. The broker itself enforces
 * the `tenant` / `full` modes' tenantKey-required invariant
 * (`MissingTenantKeyError`); we do not need to defend at this
 * layer.
 */

import type { BrokerMode } from './types';

export interface InferModeInput {
  /**
   * Canonical surface string from the agent route's
   * `canonicalizeFromBody` (URL-shaped, e.g. `/programs/APX-CDP-2026`,
   * `/programs/new`, `/intelligence`, `/home`). Unknown surfaces fall
   * through to the tenant/generic default.
   */
  surface: string | null | undefined;
  /**
   * Tenant key (e.g. `apex-retail`). Empty string treated as null.
   */
  tenantKey?: string | null;
}

const PROGRAM_DETAIL_PATTERN = /^\/programs\/[^/]+$/;
const STRATEGIC_MOVE_DETAIL_PATTERN = /^\/strategic-moves\/[^/]+$/;
const STRATEGIC_MOVE_PHASE_PATTERN = /^\/strategic-moves\/[^/]+\/phase\/[0-6]$/;
const SOURCE_DETAIL_PATTERN = /^\/source(\/.*)?$/;
const INTELLIGENCE_PATTERN = /^\/intelligence(\/.*)?$/;
const TOWER_PATTERN = /^\/tower(\/.*)?$/;
const HOME_PATTERN = /^\/home(\/.*)?$/;

/**
 * Resolve the default `BrokerMode` for a surface. Pure; no side effects.
 *
 * Decision order:
 *   1. /programs/new                                     → 'tenant'
 *   2. /programs/<id> (not /programs/new) (with tenant)  → 'full'
 *      /programs/<id>             (no tenant)            → 'generic'
 *   3. /strategic-moves/new                              → 'tenant'
 *   4. /strategic-moves/<id> or /phase/<n> (with tenant) → 'full'
 *      /strategic-moves/<id> or /phase/<n> (no tenant)   → 'generic'
 *   5. /tower (with tenant)                              → 'full'
 *      /tower (no tenant)                                → 'generic'
 *   6. /intelligence (with tenant)                       → 'full'
 *      /intelligence (no tenant)                         → 'corpus'
 *   7. /source (with tenant)                             → 'full'
 *      /source (no tenant)                               → 'generic'
 *   8. /home (with tenant) → 'tenant'; /home (no tenant) → 'generic'
 *   9. fallback: 'tenant' if tenantKey, else 'generic'
 */
export function inferModeForSurface(input: InferModeInput): BrokerMode {
  const surface = (input.surface ?? '').trim();
  const tenantKey =
    typeof input.tenantKey === 'string' && input.tenantKey.trim().length > 0
      ? input.tenantKey.trim()
      : null;

  if (surface === '/programs/new' || surface === '/demo/programs/new') {
    return 'tenant';
  }

  if (PROGRAM_DETAIL_PATTERN.test(surface)) {
    return tenantKey ? 'full' : 'generic';
  }

  if (surface === '/strategic-moves/new') {
    return tenantKey ? 'tenant' : 'generic';
  }

  if (
    STRATEGIC_MOVE_DETAIL_PATTERN.test(surface) ||
    STRATEGIC_MOVE_PHASE_PATTERN.test(surface)
  ) {
    return tenantKey ? 'full' : 'generic';
  }

  if (TOWER_PATTERN.test(surface)) {
    return tenantKey ? 'full' : 'generic';
  }

  if (INTELLIGENCE_PATTERN.test(surface)) {
    return tenantKey ? 'full' : 'corpus';
  }

  if (SOURCE_DETAIL_PATTERN.test(surface)) {
    return tenantKey ? 'full' : 'generic';
  }

  if (HOME_PATTERN.test(surface)) {
    return tenantKey ? 'tenant' : 'generic';
  }

  return tenantKey ? 'tenant' : 'generic';
}

/**
 * Validate that `mode` is admissible given the auth/tenant context.
 * `tenant` and `full` require a non-null `tenantKey`; if the caller
 * supplied them without one, the route falls back to inferred mode.
 */
export function isModeValidForAuth(
  mode: BrokerMode,
  tenantKey: string | null | undefined,
): boolean {
  const hasTenant =
    typeof tenantKey === 'string' && tenantKey.trim().length > 0;
  if (mode === 'tenant' || mode === 'full') return hasTenant;
  return true;
}

/**
 * Type guard that narrows an unknown to `BrokerMode`. Used by the
 * agent route to validate the client-supplied `surfaceContext.contextBundleMode`.
 */
export function isBrokerMode(value: unknown): value is BrokerMode {
  return (
    value === 'generic' ||
    value === 'corpus' ||
    value === 'tenant' ||
    value === 'full'
  );
}
