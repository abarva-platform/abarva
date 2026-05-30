// Atlas deep-retrieval — `getInitiativeDeepView`.
//
// ONE function. Pure retrieval. No LLM, no composition. Returns the
// `InitiativeDeepView` shape defined in `./types.ts` so Wave 3's composition
// agent can join with the IAC archetype detail and answer a CIO question
// like "tell me about AR-02 Copilot."
//
// TENANT SCOPE — P0 invariant:
//   Every join is filtered by `client_id`. If a caller passes a Meridian
//   initiative id with an Apex tenancy, the result is the honest "initiative
//   not found in this tenant" — NEVER a Meridian payload. Covered by
//   `__tests__/tenant-scoping.test.ts`.
//
// HONESTY CONTRACT:
//   - Every value surfaced is either a measured value from real tenant data
//     OR a planning range from the kernel.
//   - When a join returns nothing, surface `null` / empty array — never a
//     fabricated default. Covered by `__tests__/business-case-fallback.test.ts`
//     for the kernel `null` path.
//   - Confidence tiers downgrade honestly when input data is incomplete.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import { getServerSupabase } from '@/lib/supabase-server';
import type {
  AtlasTenancyCtx,
  InitiativeDeepView,
  InitiativeEvidenceAnchor,
} from './types';
import {
  archetypeKeyOf,
  buildBaselineMetrics,
  loadInitiativeKpis,
  loadInitiativeRow,
  ownerLabelOf,
} from './joins/ai-initiatives';
import {
  loadTowerDoraMetrics,
  loadTowerToolUsage,
  towerSamplesAsBaselineMetrics,
} from './joins/tower-metrics';
import {
  buildBusinessCaseSkeleton,
  loadTenantIndustryCode,
} from './joins/business-case';
import { buildValueAttestation } from './joins/value-attestation';
import { loadGatesForInitiative } from './joins/gates';
import { loadSignalsForInitiative } from './joins/signals';
import { computePortfolioPosition } from './joins/portfolio-position';

export type { InitiativeDeepView, AtlasTenancyCtx };

/**
 * The deep-retrieval entry point. Returns `null` honestly when the initiative
 * does not exist in the caller's tenant — NEVER a cross-tenant row.
 *
 * @param initiativeId The `ai_initiatives.initiative_id` (PK) to retrieve.
 * @param tenancy      The Atlas tenancy context — must include `clientId`.
 * @param client       Optional Postgres-compat client for tests; defaults to
 *                     the server supabase / Azure adapter.
 */
export async function getInitiativeDeepView(
  initiativeId: string,
  tenancy: AtlasTenancyCtx,
  client: PostgresCompatClient = getServerSupabase(),
): Promise<InitiativeDeepView | null> {
  // 1. Core row — tenant-scoped. If the row does not belong to this tenant,
  //    we return null. This is the first line of the P0 invariant.
  const initiative = await loadInitiativeRow(client, initiativeId, tenancy);
  if (!initiative) return null;

  // 2. Fire the dependent reads in parallel — each is tenant-scoped.
  const [
    kpiRows,
    industryCode,
    towerUsage,
    towerDora,
    gates,
    signals,
    portfolioPosition,
  ] = await Promise.all([
    loadInitiativeKpis(client, initiativeId),
    loadTenantIndustryCode(client, tenancy),
    loadTowerToolUsage(client, tenancy),
    loadTowerDoraMetrics(client, tenancy),
    loadGatesForInitiative(client, initiativeId, tenancy),
    loadSignalsForInitiative(client, initiativeId, tenancy),
    computePortfolioPosition(client, initiativeId, tenancy),
  ]);

  // 3. The kernel business-case skeleton is synchronous (pure module).
  const { skeleton, projectedRange } = buildBusinessCaseSkeleton({
    initiative,
    industryCode,
  });

  // 4. Compose the baseline metrics — initiative KPIs first, then Tower
  //    observations folded in. This preserves the recorded-quarter order
  //    while letting the composer see Tower signals alongside.
  const baselineMetrics = [
    ...buildBaselineMetrics(kpiRows),
    ...towerSamplesAsBaselineMetrics([...towerUsage, ...towerDora]),
  ];

  // 5. Value attestation — measured side from columns, projected side from
  //    the kernel skeleton (which may be null).
  const valueAttestation = buildValueAttestation({
    initiative,
    projectedRange,
  });

  // 6. Evidence anchors — claim-and-source list for the composer to render
  //    as citations. We only surface anchors grounded in real data: the
  //    initiative row itself, and any KPI with a recorded value.
  const evidenceAnchors = buildEvidenceAnchors(initiative, kpiRows);

  return {
    initiativeId: initiative.initiative_id,
    code: initiative.display_id,
    name: initiative.name,
    archetypeKey: archetypeKeyOf(initiative),
    status: initiative.stage,
    ownerLabel: ownerLabelOf(initiative),

    baselineMetrics,
    valueAttestation,
    businessCaseSkeleton: skeleton,
    gates,
    signals,
    portfolioPosition,
    evidenceAnchors,
  };
}

/**
 * Build the evidence anchors from real data only. Honest claims keyed to the
 * registry row and the KPI history — no fabricated provenance.
 */
function buildEvidenceAnchors(
  initiative: Awaited<ReturnType<typeof loadInitiativeRow>>,
  kpiRows: Awaited<ReturnType<typeof loadInitiativeKpis>>,
): InitiativeEvidenceAnchor[] {
  if (!initiative) return [];
  const out: InitiativeEvidenceAnchor[] = [];

  if (initiative.status_summary && initiative.status_summary.length > 0) {
    out.push({
      claim: initiative.status_summary,
      source: `ai_initiatives.status_summary (${initiative.initiative_id})`,
      date: '',
    });
  }

  for (const kpi of kpiRows) {
    if (kpi.kpi_value === null || kpi.kpi_value === undefined) continue;
    out.push({
      claim: `${kpi.kpi_name} = ${String(kpi.kpi_value)}${kpi.kpi_unit ? ' ' + kpi.kpi_unit : ''}`,
      source: `ai_initiative_kpis (${kpi.initiative_id})`,
      date: kpi.quarter ?? '',
    });
  }

  // Cap to keep the surface small — composer can request more.
  return out.slice(0, 12);
}
