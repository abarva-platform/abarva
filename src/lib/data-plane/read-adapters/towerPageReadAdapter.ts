// Tower page read adapter (Slice 9 — inline reads in the /tower server component).
//
// Slice 6 (Tower) migrated `lib/tower/aggregate.ts` behind
// `towerAggregateReadAdapter` but deferred the reads inlined directly in
// `src/app/(maestro)/tower/page.tsx`, because they are "policy-gated and
// tightly coupled to access-policy logic." This adapter completes that:
// it owns ONLY the PHYSICAL Supabase/Azure reads. The access-policy gating
// (whether to read at all, whether to return `[]`, and which program /
// source-event ids the caller is allowed to see) stays in the page component.
//
// HOW the coupling is honestly separated:
//   - The page still computes the program / source-event access policy and
//     decides `no_program_access` / `none` short-circuits BEFORE calling the
//     adapter — the adapter is never reached for a denied caller.
//   - When the policy yields an explicit allow-list of ids, the page passes
//     it as `allowedIds`. The adapter splices it into the read as a final
//     `id IN (...)` predicate. When `allowedIds` is `null` the page's policy
//     means "all rows in scope" and no id predicate is added.
//   - The page keeps its `try/catch` fail-soft wrappers; the adapter mirrors
//     the pre-seam fail-soft (`[]` / `0` on error) so behavior is identical.
//
// What STAYS coupled to policy logic and why: the DECISION of what `allowedIds`
// should be (derived from `loadUserProgramAccessPolicy` /
// `loadUserSourceAccessPolicy`, and the "empty list ⇒ return [] without
// querying" rule) is access-control logic, not data access. It correctly lives
// in the page. The adapter only executes the physical read it is told to.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST reads (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL reads (opt-in)

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A completed P5 Tower-handoff `engagements` row, exactly as the page consumed it. */
export interface TowerHandoffProgramRow {
  id: string;
  graph_node_id: string | null;
  name: string;
  current_phase: number | null;
  lifecycle_state: string | null;
  updated_at: string | null;
}

/** A transitioned `source_events` row, exactly as the page consumed it. */
export interface TowerHandoffSourceEventRow {
  id: string;
  event_code: string;
  event_name: string;
  current_stage_key: string;
  lifecycle_state: string | null;
  linked_program_id: string | null;
  updated_at: string | null;
}

/** The Tower-handoff stage keys read for transitioned Source events. */
const SOURCE_HANDOFF_STAGE_KEYS = [
  'transition',
  'value',
  'contract_mobilization',
  'value_realization',
] as const;

/** Related-table allowlist for the substrate count reads (Azure interpolates the
 *  table name into the SQL, so it must be a closed set). */
const COUNT_TABLE_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  'ai_initiative_kpis',
  'ai_initiative_decisions',
  'ai_initiative_stakeholder_notes',
  'ai_initiative_scenarios',
]);

/**
 * A Tower-page read adapter for one physical data plane. Every method is a
 * thin physical read; the page owns the access-policy gating that decides
 * whether — and with which `allowedIds` — these are called.
 */
export interface TowerPageReadAdapter {
  readonly name: DataPlane;
  /**
   * Count `ai_initiatives` rows for a client. Used to detect whether a pilot
   * client has Tower substrate. Fails soft to `0`.
   */
  countClientInitiatives(clientId: string): Promise<number>;
  /**
   * Count rows in a substrate child table for a set of initiative ids. The
   * table must be in the allowlist. Returns `0` for an empty id set or on a
   * read error — mirroring the pre-seam `countByInitiatives` helper.
   */
  countByInitiatives(table: string, initiativeIds: ReadonlyArray<string>): Promise<number>;
  /**
   * Read up to 6 completed P5 Tower-handoff `engagements` rows for a client.
   * `allowedIds` is the program-access policy's allow-list: `null` means
   * "no id filter" (caller has full scope). Throws on a read error — the page
   * keeps its own `try/catch` fail-soft wrapper.
   */
  listHandoffPrograms(
    clientId: string,
    allowedIds: ReadonlyArray<string> | null,
  ): Promise<TowerHandoffProgramRow[]>;
  /**
   * Read up to 6 transitioned `source_events` rows for a client key.
   * `allowedIds` is the source-access policy's allow-list: `null` means
   * "no id filter". Throws on a read error — the page wraps fail-soft.
   */
  listHandoffSourceEvents(
    clientKey: string,
    allowedIds: ReadonlyArray<string> | null,
  ): Promise<TowerHandoffSourceEventRow[]>;
}

const HANDOFF_PROGRAM_COLUMNS =
  'id, graph_node_id, name, current_phase, lifecycle_state, updated_at';
const HANDOFF_SOURCE_EVENT_COLUMNS =
  'id, event_code, event_name, current_stage_key, lifecycle_state, linked_program_id, updated_at';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Tower-page read adapter. Every query is the exact
 * `.from(...).select(...)` chain the pre-seam page ran, so the returned rows
 * are byte-identical.
 */
export function createSupabaseTowerPageReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): TowerPageReadAdapter {
  return {
    name: 'supabase',

    async countClientInitiatives(clientId) {
      try {
        const { count, error } = await getClient()
          .from('ai_initiatives')
          .select('initiative_id', { count: 'exact', head: true })
          .eq('client_id', clientId);
        if (error) return 0;
        return Number(count ?? 0);
      } catch {
        return 0;
      }
    },

    async countByInitiatives(table, initiativeIds) {
      if (initiativeIds.length === 0) return 0;
      if (!COUNT_TABLE_ALLOWLIST.has(table)) return 0;
      try {
        const { count, error } = await getClient()
          .from(table)
          .select('initiative_id', { count: 'exact', head: true })
          .in('initiative_id', [...initiativeIds]);
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    },

    async listHandoffPrograms(clientId, allowedIds) {
      let query = getClient()
        .from('engagements')
        .select(HANDOFF_PROGRAM_COLUMNS)
        .eq('client_id', clientId)
        .eq('current_phase', 5)
        .eq('lifecycle_state', 'completed')
        .is('archived_at', null)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(6);
      if (allowedIds && allowedIds.length > 0) {
        query = query.in('id', [...allowedIds]);
      }
      const { data, error } = await query;
      if (error || !data) {
        throw new Error(error?.message ?? 'tower_handoff_programs_read_failed');
      }
      return data as TowerHandoffProgramRow[];
    },

    async listHandoffSourceEvents(clientKey, allowedIds) {
      let query = getClient()
        .from('source_events')
        .select(HANDOFF_SOURCE_EVENT_COLUMNS)
        .eq('client_key', clientKey)
        .in('current_stage_key', [...SOURCE_HANDOFF_STAGE_KEYS])
        .order('updated_at', { ascending: false })
        .limit(6);
      if (allowedIds && allowedIds.length > 0) {
        query = query.in('id', [...allowedIds]);
      }
      const { data, error } = await query;
      if (error || !data) {
        throw new Error(error?.message ?? 'tower_handoff_source_events_read_failed');
      }
      return data as TowerHandoffSourceEventRow[];
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Tower-page read adapter. PostgREST `.eq()` /
 * `.in()` / `.is()` filters become `WHERE` predicates; the optional
 * policy-derived `allowedIds` filter becomes `id = ANY($n::text[])`. The
 * session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureTowerPageReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-tower-page'),
): TowerPageReadAdapter {
  return {
    name: 'azure-postgres',

    async countClientInitiatives(clientId) {
      try {
        return await session(async (run) => {
          const rows = await run<{ n: number }>(
            'SELECT count(*)::int AS n FROM ai_initiatives WHERE client_id = $1',
            [clientId],
          );
          const n = rows[0]?.n;
          return typeof n === 'number' ? n : 0;
        });
      } catch {
        return 0;
      }
    },

    async countByInitiatives(table, initiativeIds) {
      if (initiativeIds.length === 0) return 0;
      if (!COUNT_TABLE_ALLOWLIST.has(table)) return 0;
      try {
        return await session(async (run) => {
          const rows = await run<{ n: number }>(
            `SELECT count(*)::int AS n FROM ${table} WHERE initiative_id = ANY($1::text[])`,
            [[...initiativeIds]],
          );
          const n = rows[0]?.n;
          return typeof n === 'number' ? n : 0;
        });
      } catch {
        return 0;
      }
    },

    async listHandoffPrograms(clientId, allowedIds) {
      return session((run) => {
        const params: unknown[] = [clientId];
        let sql =
          `SELECT ${HANDOFF_PROGRAM_COLUMNS} FROM engagements
            WHERE client_id = $1 AND current_phase = 5
              AND lifecycle_state = 'completed'
              AND archived_at IS NULL AND deleted_at IS NULL`;
        if (allowedIds && allowedIds.length > 0) {
          params.push([...allowedIds]);
          sql += ` AND id = ANY($${params.length}::text[])`;
        }
        sql += ' ORDER BY updated_at DESC LIMIT 6';
        return run<TowerHandoffProgramRow>(sql, params);
      });
    },

    async listHandoffSourceEvents(clientKey, allowedIds) {
      return session((run) => {
        const params: unknown[] = [clientKey, [...SOURCE_HANDOFF_STAGE_KEYS]];
        let sql =
          `SELECT ${HANDOFF_SOURCE_EVENT_COLUMNS} FROM source_events
            WHERE client_key = $1 AND current_stage_key = ANY($2::text[])`;
        if (allowedIds && allowedIds.length > 0) {
          params.push([...allowedIds]);
          sql += ` AND id = ANY($${params.length}::text[])`;
        }
        sql += ' ORDER BY updated_at DESC LIMIT 6';
        return run<TowerHandoffSourceEventRow>(sql, params);
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseTowerPageReadAdapter: TowerPageReadAdapter =
  createSupabaseTowerPageReadAdapter();
export const azureTowerPageReadAdapter: TowerPageReadAdapter =
  createAzureTowerPageReadAdapter();

/** Select the Tower-page read adapter for the configured data plane. */
export function selectTowerPageReadAdapter(plane?: DataPlane): TowerPageReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureTowerPageReadAdapter
    : supabaseTowerPageReadAdapter;
}
