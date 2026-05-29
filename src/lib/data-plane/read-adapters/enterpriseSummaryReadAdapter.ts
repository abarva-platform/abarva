// Enterprise summary read adapter (Slice 6 — server-component read paths).
//
// Backs `src/lib/tower/enterprise-summary.ts` — the `loadEnterpriseSummary`
// helper rendered by the Tower `EnterpriseContextRow` server component. The
// helper reads four tenant-scoped, non-demo tables (tech stack, projects,
// staff augmentation, volumetrics) and rolls them into an `EnterpriseSummary`.
//
// The roll-up maths stays in `enterprise-summary.ts`; the data plane owns the
// four physical reads, extracted here behind the same `ABARVA_DATA_PLANE`
// switch as the rest of the seam.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST reads (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL reads (opt-in)
//
// The adapter returns the exact flat row projections `loadEnterpriseSummary`
// consumed pre-seam, so the `EnterpriseSummary` return shape is byte-identical.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A `tech_stack_items` row, non-demo, for the active tenant. */
export interface EnterpriseTechRow {
  category: string | null;
  annual_spend_usd: number | null;
  touches_ai: boolean | null;
}

/** A `tech_projects` row, non-demo, for the active tenant. */
export interface EnterpriseProjectRow {
  status: string | null;
  touches_ai: boolean | null;
  total_budget_usd: number | null;
  spent_to_date_usd: number | null;
}

/** A `staff_augmentation` row, non-demo, for the active tenant. */
export interface EnterpriseAugRow {
  headcount_fte: number | null;
  annual_spend_usd: number | null;
  touches_ai: boolean | null;
}

/** A `volumetrics_snapshots` row, non-demo, for the active tenant. */
export interface EnterpriseVolRow {
  snapshot_date: string;
  api_calls_millions: number | null;
  tokens_billions: number | null;
  active_models: number | null;
  data_pipelines: number | null;
  storage_tb: number | null;
}

/** The full raw read set `loadEnterpriseSummary` rolls up. */
export interface EnterpriseSummaryBundle {
  tech: EnterpriseTechRow[];
  projects: EnterpriseProjectRow[];
  staffAug: EnterpriseAugRow[];
  volumetrics: EnterpriseVolRow[];
}

/** An enterprise-summary read adapter for one physical data plane. */
export interface EnterpriseSummaryReadAdapter {
  readonly name: DataPlane;
  /**
   * Read the four tenant-scoped, non-demo tables `loadEnterpriseSummary`
   * rolls up for `clientId`. Volumetrics rows come ordered by snapshot date
   * ascending, capped at 30 — exactly as the pre-seam helper queried.
   */
  getEnterpriseSummaryBundle(clientId: string): Promise<EnterpriseSummaryBundle>;
}

// Column lists lifted verbatim from `enterprise-summary.ts`.
const TECH_COLUMNS = 'category, annual_spend_usd, touches_ai';
const PROJECT_COLUMNS = 'status, touches_ai, total_budget_usd, spent_to_date_usd';
const AUG_COLUMNS = 'headcount_fte, annual_spend_usd, touches_ai';
const VOL_COLUMNS =
  'snapshot_date, api_calls_millions, tokens_billions, active_models, data_pipelines, storage_tb';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase enterprise-summary adapter. The four reads are the exact
 * `.from(...).select(...).eq('client_id').eq('is_demo_data', false)` chains
 * the pre-seam helper ran in `Promise.all`, so the rows are byte-identical.
 */
export function createSupabaseEnterpriseSummaryReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): EnterpriseSummaryReadAdapter {
  return {
    name: 'supabase',
    async getEnterpriseSummaryBundle(clientId) {
      const sb = getClient();
      const [techRes, projRes, augRes, volRes] = await Promise.all([
        sb
          .from('tech_stack_items')
          .select(TECH_COLUMNS)
          .eq('client_id', clientId)
          .eq('is_demo_data', false),
        sb
          .from('tech_projects')
          .select(PROJECT_COLUMNS)
          .eq('client_id', clientId)
          .eq('is_demo_data', false),
        sb
          .from('staff_augmentation')
          .select(AUG_COLUMNS)
          .eq('client_id', clientId)
          .eq('is_demo_data', false),
        sb
          .from('volumetrics_snapshots')
          .select(VOL_COLUMNS)
          .eq('client_id', clientId)
          .eq('is_demo_data', false)
          .order('snapshot_date', { ascending: true })
          .limit(30),
      ]);

      return {
        tech: (techRes.data as EnterpriseTechRow[] | null) ?? [],
        projects: (projRes.data as EnterpriseProjectRow[] | null) ?? [],
        staffAug: (augRes.data as EnterpriseAugRow[] | null) ?? [],
        volumetrics: (volRes.data as EnterpriseVolRow[] | null) ?? [],
      };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres enterprise-summary adapter. PostgREST `.eq()`
 * filters become `WHERE` predicates; `.order()` / `.limit()` become
 * `ORDER BY` / `LIMIT`. The session runner is injectable for tests.
 */
export function createAzureEnterpriseSummaryReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-enterprise-summary'),
): EnterpriseSummaryReadAdapter {
  return {
    name: 'azure-postgres',
    async getEnterpriseSummaryBundle(clientId) {
      return session(async (run) => {
        const tech = await run<EnterpriseTechRow>(
          `SELECT ${TECH_COLUMNS} FROM tech_stack_items
            WHERE client_id = $1 AND is_demo_data = false`,
          [clientId],
        );
        const projects = await run<EnterpriseProjectRow>(
          `SELECT ${PROJECT_COLUMNS} FROM tech_projects
            WHERE client_id = $1 AND is_demo_data = false`,
          [clientId],
        );
        const staffAug = await run<EnterpriseAugRow>(
          `SELECT ${AUG_COLUMNS} FROM staff_augmentation
            WHERE client_id = $1 AND is_demo_data = false`,
          [clientId],
        );
        const volumetrics = await run<EnterpriseVolRow>(
          `SELECT ${VOL_COLUMNS} FROM volumetrics_snapshots
            WHERE client_id = $1 AND is_demo_data = false
            ORDER BY snapshot_date ASC
            LIMIT 30`,
          [clientId],
        );
        return { tech, projects, staffAug, volumetrics };
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

export const supabaseEnterpriseSummaryReadAdapter: EnterpriseSummaryReadAdapter =
  createSupabaseEnterpriseSummaryReadAdapter();
export const azureEnterpriseSummaryReadAdapter: EnterpriseSummaryReadAdapter =
  createAzureEnterpriseSummaryReadAdapter();

/** Select the enterprise-summary read adapter for the configured data plane. */
export function selectEnterpriseSummaryReadAdapter(
  plane?: DataPlane,
): EnterpriseSummaryReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureEnterpriseSummaryReadAdapter
    : supabaseEnterpriseSummaryReadAdapter;
}
