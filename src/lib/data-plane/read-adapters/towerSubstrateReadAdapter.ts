// Tower substrate read adapter (Slice 2).
//
// Backs `GET /api/debug/tower-substrate` — a diagnostic endpoint that reports
// per-tenant AI-initiative substrate counts. The adapter owns the entire
// Supabase coupling: the multi-strategy client resolution and every count
// query. The route becomes a thin shell that picks the adapter and shapes
// the JSON response.
//
// Selected by the same `ABARVA_DATA_PLANE` switch as Slice 1.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { CLIENT_KEY_TO_DB_NAME, type ClientKey } from '@/lib/client-config';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A resolved client row, as the substrate endpoint reports it. */
export interface SubstrateClientRow {
  id: string;
  name: string;
  tenant_key: string | null;
  slug: string | null;
  industry_code: string | null;
}

/** Per-tenant substrate counts, or an error string if the read failed. */
export type SubstrateCounts =
  | {
      initiatives: number;
      vendors: number | null;
      kpis: number | null;
      decisions: number | null;
      stakeholderNotes: number | null;
      scenarios: number | null;
      byStage: Record<string, number>;
      byStatus: Record<string, number>;
    }
  | { error: string };

/** One tenant's substrate report entry. */
export interface SubstrateTenantReport {
  key: ClientKey;
  client:
    | {
        id: string;
        name: string;
        tenantKey: string | null;
        slug: string | null;
        industryCode: string | null;
      }
    | null;
  counts: SubstrateCounts | null;
}

/** Tenant definition the adapter resolves and counts for. */
export interface SubstrateTenantSpec {
  key: ClientKey;
  slugAliases: string[];
}

/** A tower-substrate read adapter for one physical data plane. */
export interface TowerSubstrateReadAdapter {
  readonly name: DataPlane;
  /** Resolve + count substrate for each tenant spec. Never throws. */
  getSubstrateReport(
    tenants: readonly SubstrateTenantSpec[],
  ): Promise<SubstrateTenantReport[]>;
}

const CLIENT_COLUMNS = 'id, name, tenant_key, slug, industry_code';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase tower-substrate adapter. Query logic lifted verbatim
 * from `/api/debug/tower-substrate` so the response is byte-identical.
 */
export function createSupabaseTowerSubstrateReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): TowerSubstrateReadAdapter {
  const resolveClient = async (
    sb: SupabaseClient,
    key: ClientKey,
    slugAliases: string[],
  ): Promise<SubstrateClientRow | null> => {
    for (const tenantKey of [key, ...slugAliases]) {
      const { data } = await sb
        .from('clients')
        .select(CLIENT_COLUMNS)
        .eq('tenant_key', tenantKey)
        .limit(1);
      if (data?.[0]) return data[0] as SubstrateClientRow;
    }
    for (const slug of slugAliases) {
      const { data } = await sb
        .from('clients')
        .select(CLIENT_COLUMNS)
        .eq('slug', slug)
        .limit(1);
      if (data?.[0]) return data[0] as SubstrateClientRow;
    }
    for (const name of CLIENT_KEY_TO_DB_NAME[key]) {
      const { data } = await sb
        .from('clients')
        .select(CLIENT_COLUMNS)
        .ilike('name', `${name}%`)
        .limit(1);
      if (data?.[0]) return data[0] as SubstrateClientRow;
    }
    return null;
  };

  const countRows = async (
    sb: SupabaseClient,
    table: string,
    column: string,
    values: string[],
  ): Promise<number | null> => {
    if (values.length === 0) return 0;
    const { count, error } = await sb
      .from(table)
      .select(column, { count: 'exact', head: true })
      .in(column, values);
    if (error) return null;
    return count ?? 0;
  };

  return {
    name: 'supabase',
    async getSubstrateReport(tenants) {
      const sb = getClient();
      const out: SubstrateTenantReport[] = [];
      for (const tenant of tenants) {
        const client = await resolveClient(sb, tenant.key, tenant.slugAliases);
        if (!client) {
          out.push({ key: tenant.key, client: null, counts: null });
          continue;
        }
        const {
          data: initiatives,
          count: initiativeCount,
          error: initiativesError,
        } = await sb
          .from('ai_initiatives')
          .select('initiative_id, stage, status_flag', { count: 'exact' })
          .eq('client_id', client.id);

        const initiativeIds =
          initiatives?.map((row) => String(row.initiative_id)) ?? [];
        const stages: Record<string, number> = {};
        const statuses: Record<string, number> = {};
        for (const row of initiatives ?? []) {
          stages[String(row.stage)] = (stages[String(row.stage)] ?? 0) + 1;
          statuses[String(row.status_flag)] =
            (statuses[String(row.status_flag)] ?? 0) + 1;
        }

        out.push({
          key: tenant.key,
          client: {
            id: client.id,
            name: client.name,
            tenantKey: client.tenant_key,
            slug: client.slug,
            industryCode: client.industry_code,
          },
          counts: initiativesError
            ? { error: initiativesError.message }
            : {
                initiatives: initiativeCount ?? 0,
                vendors: await countRows(sb, 'ai_initiative_vendors', 'initiative_id', initiativeIds),
                kpis: await countRows(sb, 'ai_initiative_kpis', 'initiative_id', initiativeIds),
                decisions: await countRows(sb, 'ai_initiative_decisions', 'initiative_id', initiativeIds),
                stakeholderNotes: await countRows(sb, 'ai_initiative_stakeholder_notes', 'initiative_id', initiativeIds),
                scenarios: await countRows(sb, 'ai_initiative_scenarios', 'initiative_id', initiativeIds),
                byStage: stages,
                byStatus: statuses,
              },
        });
      }
      return out;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/** Allowlist of tables this adapter reads from (table names are interpolated). */
const ALLOWED_RELATED_TABLES: ReadonlySet<string> = new Set<string>([
  'ai_initiative_vendors',
  'ai_initiative_kpis',
  'ai_initiative_decisions',
  'ai_initiative_stakeholder_notes',
  'ai_initiative_scenarios',
]);

/**
 * Build the Azure Postgres tower-substrate adapter. Mirrors the Supabase
 * query semantics; session runner is injectable for tests.
 */
export function createAzureTowerSubstrateReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-tower'),
): TowerSubstrateReadAdapter {
  const resolveClient = async (
    run: Parameters<Parameters<SessionRunner>[0]>[0],
    key: ClientKey,
    slugAliases: string[],
  ): Promise<SubstrateClientRow | null> => {
    for (const tenantKey of [key, ...slugAliases]) {
      const rows = await run<SubstrateClientRow>(
        `SELECT ${CLIENT_COLUMNS} FROM clients WHERE tenant_key = $1 LIMIT 1`,
        [tenantKey],
      );
      if (rows[0]) return rows[0];
    }
    for (const slug of slugAliases) {
      const rows = await run<SubstrateClientRow>(
        `SELECT ${CLIENT_COLUMNS} FROM clients WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      if (rows[0]) return rows[0];
    }
    for (const name of CLIENT_KEY_TO_DB_NAME[key]) {
      const rows = await run<SubstrateClientRow>(
        `SELECT ${CLIENT_COLUMNS} FROM clients WHERE name ILIKE $1 LIMIT 1`,
        [`${name}%`],
      );
      if (rows[0]) return rows[0];
    }
    return null;
  };

  const countRows = async (
    run: Parameters<Parameters<SessionRunner>[0]>[0],
    table: string,
    values: string[],
  ): Promise<number | null> => {
    if (values.length === 0) return 0;
    if (!ALLOWED_RELATED_TABLES.has(table)) {
      throw new Error(`tower_substrate_table_not_allowed: ${table}`);
    }
    try {
      const rows = await run<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE initiative_id = ANY($1::text[])`,
        [values],
      );
      const n = rows[0]?.n;
      return typeof n === 'number' ? n : 0;
    } catch {
      return null;
    }
  };

  return {
    name: 'azure-postgres',
    async getSubstrateReport(tenants) {
      return session(async (run) => {
        const out: SubstrateTenantReport[] = [];
        for (const tenant of tenants) {
          const client = await resolveClient(run, tenant.key, tenant.slugAliases);
          if (!client) {
            out.push({ key: tenant.key, client: null, counts: null });
            continue;
          }
          let initiatives: Array<{ initiative_id: unknown; stage: unknown; status_flag: unknown }>;
          try {
            initiatives = await run(
              'SELECT initiative_id, stage, status_flag FROM ai_initiatives WHERE client_id = $1',
              [client.id],
            );
          } catch (err) {
            out.push({
              key: tenant.key,
              client: {
                id: client.id,
                name: client.name,
                tenantKey: client.tenant_key,
                slug: client.slug,
                industryCode: client.industry_code,
              },
              counts: { error: err instanceof Error ? err.message : 'unknown' },
            });
            continue;
          }
          const initiativeIds = initiatives.map((row) => String(row.initiative_id));
          const stages: Record<string, number> = {};
          const statuses: Record<string, number> = {};
          for (const row of initiatives) {
            stages[String(row.stage)] = (stages[String(row.stage)] ?? 0) + 1;
            statuses[String(row.status_flag)] =
              (statuses[String(row.status_flag)] ?? 0) + 1;
          }
          out.push({
            key: tenant.key,
            client: {
              id: client.id,
              name: client.name,
              tenantKey: client.tenant_key,
              slug: client.slug,
              industryCode: client.industry_code,
            },
            counts: {
              initiatives: initiatives.length,
              vendors: await countRows(run, 'ai_initiative_vendors', initiativeIds),
              kpis: await countRows(run, 'ai_initiative_kpis', initiativeIds),
              decisions: await countRows(run, 'ai_initiative_decisions', initiativeIds),
              stakeholderNotes: await countRows(run, 'ai_initiative_stakeholder_notes', initiativeIds),
              scenarios: await countRows(run, 'ai_initiative_scenarios', initiativeIds),
              byStage: stages,
              byStatus: statuses,
            },
          });
        }
        return out;
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

export const supabaseTowerSubstrateReadAdapter: TowerSubstrateReadAdapter =
  createSupabaseTowerSubstrateReadAdapter();
export const azureTowerSubstrateReadAdapter: TowerSubstrateReadAdapter =
  createAzureTowerSubstrateReadAdapter();

/** Select the tower-substrate read adapter for the configured data plane. */
export function selectTowerSubstrateReadAdapter(
  plane?: DataPlane,
): TowerSubstrateReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureTowerSubstrateReadAdapter
    : supabaseTowerSubstrateReadAdapter;
}
