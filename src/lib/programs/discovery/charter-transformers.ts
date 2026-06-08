// =============================================================================
// Discovery Intake — charter JSONB transformers (S2a)
// -----------------------------------------------------------------------------
// Pure embed/read of DiscoveryShape (emitted P0 Originate) and DiscoveryPlan
// (emitted P1 Charter) inside the existing `engagements.charter` JSONB.
//
// NO migration: the charter column stays `Record<string, unknown>`. These
// helpers are the single seam for putting discovery data in / out of it, with
// null-safe reads that defend against legacy (pre-discovery) engagements and
// malformed JSONB. No DB, no routes, no side effects — wiring is S2b/S2c.
// =============================================================================

import type { DiscoveryShape, DiscoveryPlan } from './discovery-intake';

const SHAPE_KEY = 'discovery_shape';
const PLAN_KEY = 'discovery_plan';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Embed the P0 shape into a charter. A null shape leaves the charter untouched. */
export function embedDiscoveryShapeInCharter(
  charter: Record<string, unknown>,
  shape: DiscoveryShape | null,
): Record<string, unknown> {
  if (!shape) return charter;
  return { ...charter, [SHAPE_KEY]: shape };
}

/** Embed the P1 plan into a charter, creating a base when the charter is null. */
export function embedDiscoveryPlanInCharter(
  charter: Record<string, unknown> | null,
  plan: DiscoveryPlan | null,
): Record<string, unknown> {
  const base = charter ?? {};
  if (!plan) return base;
  return { ...base, [PLAN_KEY]: plan };
}

/** Safe read of the P0 shape — null for legacy/malformed charters. */
export function readDiscoveryShapeFromCharter(
  charter: Record<string, unknown> | null,
): DiscoveryShape | null {
  if (!charter) return null;
  const v = charter[SHAPE_KEY];
  return isPlainObject(v) ? (v as unknown as DiscoveryShape) : null;
}

/** Safe read of the P1 plan — null for legacy/malformed charters. */
export function readDiscoveryPlanFromCharter(
  charter: Record<string, unknown> | null,
): DiscoveryPlan | null {
  if (!charter) return null;
  const v = charter[PLAN_KEY];
  return isPlainObject(v) ? (v as unknown as DiscoveryPlan) : null;
}

/** Read both discovery objects from a charter in one call. */
export function readDiscoveryDataFromCharter(
  charter: Record<string, unknown> | null,
): { shape: DiscoveryShape | null; plan: DiscoveryPlan | null } {
  return {
    shape: readDiscoveryShapeFromCharter(charter),
    plan: readDiscoveryPlanFromCharter(charter),
  };
}

/**
 * P0 gate helper (S2b): embed the shape only when the feature flag is on AND a
 * shape was captured. Pure — the flag decision is passed in, so the wiring stays
 * unit-testable without a live tenant or DB. No-op (same reference) otherwise.
 */
export function applyDiscoveryShapeIfEnabled(
  charter: Record<string, unknown>,
  shape: DiscoveryShape | null | undefined,
  flagEnabled: boolean,
): Record<string, unknown> {
  if (!flagEnabled || !shape) return charter;
  return embedDiscoveryShapeInCharter(charter, shape);
}
