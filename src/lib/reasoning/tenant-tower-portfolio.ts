// Tenant-scoped portfolio loader for the Tower synthesis route.
//
// CRITICAL — this module exists to close the P0 cross-tenant leak in
// /api/tower/synthesis where APEX_RETAIL_PROGRAM_INSTANCES used to be a
// hardcoded import. After Atlas Fix A (2026-05-30), Tower synthesis must
// load portfolio inputs scoped to the signed-in tenant. Apex Retail
// fixtures may ONLY be returned when the signed-in tenant is Apex AND
// the demo-fallback feature flag is on for that tenant.
//
// Other tenants currently have no ProgramInstance / SourceEventInstance
// fixtures, so they receive empty arrays. The synthesis route is
// expected to handle empty arrays honestly — the model is told there is
// no active portfolio rather than being silently fed Apex's data.
//
// Future tenants: add a per-tenant case below and wire their fixtures
// or live adapter (Tower data plane) here.

import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';
import {
  LAKESHORE_TOWER_PROGRAM_INSTANCES,
  LAKESHORE_TOWER_SOURCE_EVENT_INSTANCES,
} from '@/lib/reasoning/lakeshore-tower-portfolio';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';

export interface TenantTowerPortfolio {
  programInstances: ProgramInstance[];
  sourceEventInstances: SourceEventInstance[];
  /**
   * True when the returned arrays were sourced from the Apex Retail demo
   * fixture under an explicit gated fallback. Always false for non-Apex
   * tenants. Surfaces in telemetry so we can detect any regression where
   * a non-Apex tenant accidentally lands on the fixture.
   */
  fromApexFixture: boolean;
}

const EMPTY_PORTFOLIO: TenantTowerPortfolio = {
  programInstances: [],
  sourceEventInstances: [],
  fromApexFixture: false,
};

/**
 * Load Tower-synthesis portfolio inputs for the active tenant.
 *
 * Tenant gating rules:
 *
 *   - `apexretail` — if the `tower_synthesis_apex_demo_fixture` feature
 *     flag is enabled for the tenant, return the Apex demo fixture.
 *     Otherwise return empty (honest empty-state, no silent fallback).
 *
 *   - `lakeshore` / `lakeshore-holdings` — return the tenant-scoped
 *     Lakeshore Kyriba portfolio fixture used by the demo-readiness lane.
 *
 *   - any other tenant (meridian, arcturus, unknown, …) — always return
 *     empty arrays. NEVER return Apex or Lakeshore content as the silent default.
 *
 * The synthesis route gates on the resulting array lengths and tells the
 * model there is nothing to synthesize when both are empty.
 */
export function loadTenantTowerPortfolio(tenancy: {
  clientKey?: string;
  clientId?: string;
}): TenantTowerPortfolio {
  const tenantKey = tenancy.clientKey?.toLowerCase() ?? '';

  if (tenantKey === 'apexretail') {
    const apexAllowed = isFeatureEnabled(tenancy, 'tower_synthesis_apex_demo_fixture');
    if (apexAllowed) {
      return {
        programInstances: APEX_RETAIL_PROGRAM_INSTANCES,
        sourceEventInstances: SOURCE_EVENT_INSTANCES,
        fromApexFixture: true,
      };
    }
    return EMPTY_PORTFOLIO;
  }

  if (tenantKey === 'lakeshore' || tenantKey === 'lakeshore-holdings') {
    return {
      programInstances: LAKESHORE_TOWER_PROGRAM_INSTANCES,
      sourceEventInstances: LAKESHORE_TOWER_SOURCE_EVENT_INSTANCES,
      fromApexFixture: false,
    };
  }

  // All other tenants — empty by construction. No silent fallback.
  return EMPTY_PORTFOLIO;
}
