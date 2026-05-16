// Tower aggregate read adapter (Slice 6 — server-component read paths).
//
// Backs `src/lib/tower/aggregate.ts` — the `listTowerClients` /
// `buildTowerViewModel` helpers consumed by the Tower preview shell and the
// Atlas rail. The roll-up / averaging / freshness maths in `aggregate.ts` is
// pure presentation logic and stays there; the ONE thing the data plane owns
// is the set of tenant-scoped row reads. Those reads are extracted here
// behind the same `ABARVA_DATA_PLANE` switch as the rest of the seam.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST reads (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL reads (opt-in)
//
// The adapter returns the exact flat row projections `aggregate.ts` consumed
// pre-seam, so `TowerClient[]` / `TowerViewModel` return shapes — and every
// caller — keep working unchanged.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A `clients` row as the Tower client selector consumes it. */
export interface TowerClientRow {
  id: string;
  name: string;
  industry_code: string | null;
}

/** A `use_cases` inventory row scoped to the active tenant. */
export interface TowerUseCaseRow {
  id: string;
  stage: string;
  business_unit: string | null;
  updated_at: string;
}

/** Flat `Record<string, unknown>` rows for the metric tables (matches the
 *  pre-seam `JsonObj` typing in `aggregate.ts`). */
export type TowerMetricRow = Record<string, unknown>;

/** A `contradictions` row, unresolved, for the active tenant. */
export interface TowerContradictionRow {
  id: string;
  contradiction_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggested_action: string | null;
  evidence: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  triggered_engagement_id: string | null;
  use_case_id: string | null;
}

/** The full raw read set `buildTowerViewModel` rolls up. */
export interface TowerAggregateBundle {
  useCases: TowerUseCaseRow[];
  usage: TowerMetricRow[];
  value: TowerMetricRow[];
  risk: TowerMetricRow[];
  cost: TowerMetricRow[];
  contradictions: TowerContradictionRow[];
}

/** A Tower-aggregate read adapter for one physical data plane. */
export interface TowerAggregateReadAdapter {
  readonly name: DataPlane;
  /**
   * List every `clients` row, ordered by name ascending. Returns `[]` on a
   * read failure — the pre-seam `listTowerClients` swallowed the error.
   */
  listClients(): Promise<TowerClientRow[]>;
  /**
   * Read every tenant-scoped substrate row `buildTowerViewModel` rolls up
   * for `clientId`. Metric reads are skipped (empty arrays) when the tenant
   * has no use cases — exactly as the pre-seam helper short-circuited.
   */
  getAggregateBundle(clientId: string): Promise<TowerAggregateBundle>;
}

// Column lists lifted verbatim from `aggregate.ts`.
const CLIENT_COLUMNS = 'id, name, industry_code';
const USE_CASE_COLUMNS = 'id, stage, business_unit, updated_at';
const USAGE_COLUMNS =
  'use_case_id, penetration_pct, dau, wau, drop_off_rate_pct, period_end, created_at';
const VALUE_COLUMNS =
  'use_case_id, value_driver, baseline, observed, confidence, created_at';
const RISK_COLUMNS =
  'use_case_id, model_risk_level, governance_approval_status, bias_incidents_count, data_classification, updated_at';
const COST_COLUMNS =
  'use_case_id, llm_spend_usd, compute_spend_usd, storage_spend_usd, vendor_license_spend_usd, integration_spend_usd, total_spend_usd, projected_6mo_spend_usd, period_end, created_at';
const CONTRADICTION_COLUMNS =
  'id, contradiction_type, severity, description, suggested_action, evidence, detected_at, resolved_at, triggered_engagement_id, use_case_id';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Tower-aggregate adapter. Every query is the exact
 * `.from(...).select(...).eq(...)` chain the pre-seam helper ran, so the
 * returned rows are byte-identical.
 */
export function createSupabaseTowerAggregateReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): TowerAggregateReadAdapter {
  return {
    name: 'supabase',
    async listClients() {
      const { data, error } = await getClient()
        .from('clients')
        .select(CLIENT_COLUMNS)
        .order('name', { ascending: true });
      if (error) return [];
      return (data ?? []) as TowerClientRow[];
    },
    async getAggregateBundle(clientId) {
      const sb = getClient();

      const { data: useCases } = await sb
        .from('use_cases')
        .select(USE_CASE_COLUMNS)
        .eq('client_id', clientId);
      const useCaseRows = (useCases as TowerUseCaseRow[] | null) ?? [];
      const useCaseIds = useCaseRows.map((r) => r.id);

      const { data: usageRows } =
        useCaseIds.length > 0
          ? await sb
              .from('use_case_usage_metrics')
              .select(USAGE_COLUMNS)
              .in('use_case_id', useCaseIds)
          : { data: [] };

      const { data: valueRows } =
        useCaseIds.length > 0
          ? await sb
              .from('use_case_value_metrics')
              .select(VALUE_COLUMNS)
              .in('use_case_id', useCaseIds)
          : { data: [] };

      const { data: riskRows } =
        useCaseIds.length > 0
          ? await sb
              .from('use_case_risk')
              .select(RISK_COLUMNS)
              .in('use_case_id', useCaseIds)
          : { data: [] };

      const { data: costRows } =
        useCaseIds.length > 0
          ? await sb
              .from('use_case_cost_metrics')
              .select(COST_COLUMNS)
              .in('use_case_id', useCaseIds)
          : { data: [] };

      const { data: contradictionRows } = await sb
        .from('contradictions')
        .select(CONTRADICTION_COLUMNS)
        .eq('client_id', clientId)
        .is('resolved_at', null)
        .order('severity', { ascending: true });

      return {
        useCases: useCaseRows,
        usage: (usageRows as TowerMetricRow[] | null) ?? [],
        value: (valueRows as TowerMetricRow[] | null) ?? [],
        risk: (riskRows as TowerMetricRow[] | null) ?? [],
        cost: (costRows as TowerMetricRow[] | null) ?? [],
        contradictions: (contradictionRows as TowerContradictionRow[] | null) ?? [],
      };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Tower-aggregate adapter. PostgREST `.eq()` /
 * `.in()` filters become `WHERE` predicates; `.order()` becomes `ORDER BY`.
 * The `.in('use_case_id', ids)` filter becomes `= ANY($1::text[])`. The
 * session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureTowerAggregateReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-tower-aggregate'),
): TowerAggregateReadAdapter {
  return {
    name: 'azure-postgres',
    async listClients() {
      try {
        return await session((run) =>
          run<TowerClientRow>(
            `SELECT ${CLIENT_COLUMNS} FROM clients ORDER BY name ASC`,
            [],
          ),
        );
      } catch {
        return [];
      }
    },
    async getAggregateBundle(clientId) {
      return session(async (run) => {
        const useCases = await run<TowerUseCaseRow>(
          `SELECT ${USE_CASE_COLUMNS} FROM use_cases WHERE client_id = $1`,
          [clientId],
        );
        const useCaseIds = useCases.map((r) => r.id);

        const readByUseCase = async (
          table: string,
          columns: string,
        ): Promise<TowerMetricRow[]> => {
          if (useCaseIds.length === 0) return [];
          return run<TowerMetricRow>(
            `SELECT ${columns} FROM ${table} WHERE use_case_id = ANY($1::text[])`,
            [useCaseIds],
          );
        };

        const usage = await readByUseCase('use_case_usage_metrics', USAGE_COLUMNS);
        const value = await readByUseCase('use_case_value_metrics', VALUE_COLUMNS);
        const risk = await readByUseCase('use_case_risk', RISK_COLUMNS);
        const cost = await readByUseCase('use_case_cost_metrics', COST_COLUMNS);

        const contradictions = await run<TowerContradictionRow>(
          `SELECT ${CONTRADICTION_COLUMNS} FROM contradictions
            WHERE client_id = $1 AND resolved_at IS NULL
            ORDER BY severity ASC`,
          [clientId],
        );

        return { useCases, usage, value, risk, cost, contradictions };
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

export const supabaseTowerAggregateReadAdapter: TowerAggregateReadAdapter =
  createSupabaseTowerAggregateReadAdapter();
export const azureTowerAggregateReadAdapter: TowerAggregateReadAdapter =
  createAzureTowerAggregateReadAdapter();

/** Select the Tower-aggregate read adapter for the configured data plane. */
export function selectTowerAggregateReadAdapter(
  plane?: DataPlane,
): TowerAggregateReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureTowerAggregateReadAdapter
    : supabaseTowerAggregateReadAdapter;
}
