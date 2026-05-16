// Intelligence stages read adapter (Slice 5 — server-component read paths).
//
// Backs the remaining Intelligence v3 stages rendered by the `/intelligence`
// server component via `intelligence-v3/stages-data.ts`:
//
//   - `getByFunctionData`   — reads `ai_initiative_decisions` + `ai_initiative_vendors`
//   - `getPeerActivityData` — reads `ai_initiative_kpis` (peer_median set)
//   - `getMyStrategyData`   — pure roll-up over already-loaded page data; no read
//
// The roll-up / grouping / sort maths is pure presentation logic and stays
// in `stages-data.ts`; the ONE thing the data plane owns is the three
// `initiative_id IN (...)` row reads. They are extracted here behind the same
// `ABARVA_DATA_PLANE` switch as the rest of the seam so the Intelligence page
// can parallel-run against Azure Postgres.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST `.in(...)` (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres `= ANY(...)` (opt-in)
//
// Every pre-seam read used `data ?? []` (it never threw on a query error —
// the stage builder fails closed to `null` at a higher level). The adapters
// preserve that: a query error yields `[]`, not a throw. Row shapes are the
// exact projections `stages-data.ts` consumed pre-seam, so helper signatures
// and return shapes are byte-identical and every caller keeps working.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** One `ai_initiative_decisions` row — the projection the Gates lens reads. */
export interface IntelligenceDecisionRow {
  initiative_id: string;
  decision_status: string;
}

/** One `ai_initiative_vendors` row — the projection the Dependencies lens reads. */
export interface IntelligenceStageVendorRow {
  initiative_id: string;
  renewal_date: string | null;
  vendor_name: string;
  financial_health: string | null;
}

/** One `ai_initiative_kpis` row — the projection the Peer activity lens reads. */
export interface IntelligenceKpiRow {
  initiative_id: string;
  kpi_name: string;
  kpi_unit: string | null;
  quarter: string;
  kpi_value: number | string;
  target_value: number | string | null;
  peer_median: number | string;
  confidence_level: string | null;
}

/** An Intelligence-stages read adapter for one physical data plane. */
export interface IntelligenceStagesReadAdapter {
  readonly name: DataPlane;
  /**
   * Read `ai_initiative_decisions` rows for the given initiative ids.
   * Returns `[]` on a query error — fail-soft, matching the pre-seam helper.
   */
  getDecisionRowsForInitiatives(
    initiativeIds: readonly string[],
  ): Promise<IntelligenceDecisionRow[]>;
  /**
   * Read `ai_initiative_vendors` rows for the given initiative ids.
   * Returns `[]` on a query error — fail-soft, matching the pre-seam helper.
   */
  getVendorRowsForInitiatives(
    initiativeIds: readonly string[],
  ): Promise<IntelligenceStageVendorRow[]>;
  /**
   * Read `ai_initiative_kpis` rows (only where `peer_median` is set) for the
   * given initiative ids. Returns `[]` on a query error — fail-soft.
   */
  getKpiRowsForInitiatives(
    initiativeIds: readonly string[],
  ): Promise<IntelligenceKpiRow[]>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

const DECISIONS_SELECT = 'initiative_id, decision_status';
const VENDORS_SELECT = 'initiative_id, renewal_date, vendor_name, financial_health';
const KPIS_SELECT =
  'initiative_id, kpi_name, kpi_unit, quarter, kpi_value, target_value, peer_median, confidence_level';

/**
 * Build the Supabase Intelligence-stages adapter. Each query is the exact
 * `.from(table).select(...).in('initiative_id', ids)` the pre-seam helper
 * ran, so the returned rows are byte-identical.
 */
export function createSupabaseIntelligenceStagesReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): IntelligenceStagesReadAdapter {
  return {
    name: 'supabase',
    async getDecisionRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      const sb = getClient();
      const { data } = await sb
        .from('ai_initiative_decisions')
        .select(DECISIONS_SELECT)
        .in('initiative_id', initiativeIds as string[]);
      return (data ?? []) as IntelligenceDecisionRow[];
    },
    async getVendorRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      const sb = getClient();
      const { data } = await sb
        .from('ai_initiative_vendors')
        .select(VENDORS_SELECT)
        .in('initiative_id', initiativeIds as string[]);
      return (data ?? []) as IntelligenceStageVendorRow[];
    },
    async getKpiRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      const sb = getClient();
      const { data } = await sb
        .from('ai_initiative_kpis')
        .select(KPIS_SELECT)
        .in('initiative_id', initiativeIds as string[])
        .not('peer_median', 'is', null);
      return (data ?? []) as IntelligenceKpiRow[];
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Intelligence-stages adapter. The PostgREST
 * `.in('initiative_id', ids)` becomes `WHERE initiative_id = ANY($1::text[])`;
 * the `.not('peer_median', 'is', null)` becomes `AND peer_median IS NOT NULL`.
 * A query error is swallowed to `[]` — the pre-seam helper never threw. The
 * session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureIntelligenceStagesReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-intelligence-stages'),
): IntelligenceStagesReadAdapter {
  return {
    name: 'azure-postgres',
    async getDecisionRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      try {
        return await session((run) =>
          run<IntelligenceDecisionRow>(
            `SELECT initiative_id, decision_status
               FROM ai_initiative_decisions
              WHERE initiative_id = ANY($1::text[])`,
            [initiativeIds as string[]],
          ),
        );
      } catch {
        return [];
      }
    },
    async getVendorRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      try {
        return await session((run) =>
          run<IntelligenceStageVendorRow>(
            `SELECT initiative_id, renewal_date, vendor_name, financial_health
               FROM ai_initiative_vendors
              WHERE initiative_id = ANY($1::text[])`,
            [initiativeIds as string[]],
          ),
        );
      } catch {
        return [];
      }
    },
    async getKpiRowsForInitiatives(initiativeIds) {
      if (initiativeIds.length === 0) return [];
      try {
        return await session((run) =>
          run<IntelligenceKpiRow>(
            `SELECT initiative_id, kpi_name, kpi_unit, quarter, kpi_value,
                    target_value, peer_median, confidence_level
               FROM ai_initiative_kpis
              WHERE initiative_id = ANY($1::text[])
                AND peer_median IS NOT NULL`,
            [initiativeIds as string[]],
          ),
        );
      } catch {
        return [];
      }
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseIntelligenceStagesReadAdapter: IntelligenceStagesReadAdapter =
  createSupabaseIntelligenceStagesReadAdapter();
export const azureIntelligenceStagesReadAdapter: IntelligenceStagesReadAdapter =
  createAzureIntelligenceStagesReadAdapter();

/** Select the Intelligence-stages read adapter for the configured data plane. */
export function selectIntelligenceStagesReadAdapter(
  plane?: DataPlane,
): IntelligenceStagesReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureIntelligenceStagesReadAdapter
    : supabaseIntelligenceStagesReadAdapter;
}
