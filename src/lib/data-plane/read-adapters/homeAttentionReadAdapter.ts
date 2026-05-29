// Home attention read adapter (Slice 5 — server-component read paths).
//
// Backs the authenticated Home attention aggregator `loadHomeAttention` in
// `lib/home/aggregate.ts` — "what should the signed-in user look at today":
// open contradictions (alerts) + engagements awaiting input (queue).
//
// The aggregator's sort / shaping / gate-parsing logic is pure presentation
// maths and stays in `aggregate.ts`; the data plane owns ONLY the three
// physical reads, extracted here behind the same `ABARVA_DATA_PLANE` switch.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL (opt-in)
//
// Every pre-seam read was already fail-soft: the aggregator wraps each block
// in try/catch and degrades to `[]` so the page always renders. The adapters
// preserve that — a query error yields `[]`, never a throw. Row shapes are
// the exact projections `aggregate.ts` consumed pre-seam, so the
// `loadHomeAttention` signature and `HomeAttention` return shape are
// byte-identical and the caller keeps working unchanged.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** One open-contradiction row joined to its `clients` parent. */
export interface HomeContradictionRow {
  id: string;
  client_id: string | null;
  contradiction_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  detected_at: string;
  triggered_engagement_id: string | null;
  client: { id: string; name: string } | null;
}

/** One active-engagement row — the queue projection. */
export interface HomeEngagementRow {
  id: string;
  graph_node_id: string;
  name: string;
  current_phase: number;
  status: string;
  updated_at: string;
  gates_passed: unknown[] | null;
  client_id: string | null;
}

/** One `turns` row — the latest-turn-per-engagement projection. */
export interface HomeTurnRow {
  engagement_id: string;
  sender: string;
  created_at: string;
}

/** A Home-attention read adapter for one physical data plane. */
export interface HomeAttentionReadAdapter {
  readonly name: DataPlane;
  /**
   * Read up to `limit` most-recent open contradictions, optionally scoped
   * to `clientId`. Returns `[]` on a query error — fail-soft.
   */
  getOpenContradictions(
    limit: number,
    clientId?: string | null,
  ): Promise<HomeContradictionRow[]>;
  /**
   * Read up to 30 most-recently-updated active engagements, optionally
   * scoped to `clientId`. Returns `[]` on a query error — fail-soft.
   */
  getActiveEngagements(clientId?: string | null): Promise<HomeEngagementRow[]>;
  /**
   * Read the 60 most-recent turns for the given engagement ids. Returns `[]`
   * on a query error or when `engagementIds` is empty — fail-soft.
   */
  getRecentTurns(engagementIds: readonly string[]): Promise<HomeTurnRow[]>;
}

// --- Shared select / SQL fragments -----------------------------------------

const CONTRADICTIONS_SELECT =
  'id, client_id, contradiction_type, severity, description, detected_at, triggered_engagement_id, client:clients(id, name)';
const ENGAGEMENTS_SELECT =
  'id, graph_node_id, name, current_phase, status, updated_at, gates_passed, client_id';
const TURNS_SELECT = 'engagement_id, sender, created_at';

/** Most-recent active-engagement scan window — lifted verbatim from the aggregator. */
const ENGAGEMENT_SCAN_LIMIT = 30;
/** Most-recent turns scan window — lifted verbatim from the aggregator. */
const TURNS_SCAN_LIMIT = 60;

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Home-attention adapter. Each query is the exact builder
 * chain `loadHomeAttention` ran pre-seam, so returned rows are byte-identical.
 */
export function createSupabaseHomeAttentionReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): HomeAttentionReadAdapter {
  return {
    name: 'supabase',
    async getOpenContradictions(limit, clientId) {
      try {
        const sb = getClient();
        let query = sb
          .from('contradictions')
          .select(CONTRADICTIONS_SELECT)
          .is('resolved_at', null)
          .order('detected_at', { ascending: false })
          .limit(limit);
        if (clientId) query = query.eq('client_id', clientId);
        const { data } = await query;
        return (data as HomeContradictionRow[] | null) ?? [];
      } catch {
        return [];
      }
    },
    async getActiveEngagements(clientId) {
      try {
        const sb = getClient();
        let query = sb
          .from('engagements')
          .select(ENGAGEMENTS_SELECT)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(ENGAGEMENT_SCAN_LIMIT);
        if (clientId) query = query.eq('client_id', clientId);
        const { data } = await query;
        return (data as HomeEngagementRow[] | null) ?? [];
      } catch {
        return [];
      }
    },
    async getRecentTurns(engagementIds) {
      if (engagementIds.length === 0) return [];
      try {
        const sb = getClient();
        const { data } = await sb
          .from('turns')
          .select(TURNS_SELECT)
          .in('engagement_id', engagementIds as string[])
          .order('created_at', { ascending: false })
          .limit(TURNS_SCAN_LIMIT);
        return (data as HomeTurnRow[] | null) ?? [];
      } catch {
        return [];
      }
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Home-attention adapter. The PostgREST `clients`
 * embed becomes an explicit `LEFT JOIN`; `.is('resolved_at', null)` becomes
 * `IS NULL`; `.in(...)` becomes `= ANY($1::text[])`. Row semantics are
 * identical. Every read is fail-soft (`[]` on error) — matching the pre-seam
 * aggregator. The session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureHomeAttentionReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-home-attention'),
): HomeAttentionReadAdapter {
  return {
    name: 'azure-postgres',
    async getOpenContradictions(limit, clientId) {
      try {
        return await session(async (run) => {
          const rows = await run<{
            id: string;
            client_id: string | null;
            contradiction_type: string;
            severity: 'high' | 'medium' | 'low';
            description: string;
            detected_at: string;
            triggered_engagement_id: string | null;
            c_id: string | null;
            c_name: string | null;
          }>(
            `SELECT x.id, x.client_id, x.contradiction_type, x.severity,
                    x.description, x.detected_at, x.triggered_engagement_id,
                    c.id AS c_id, c.name AS c_name
               FROM contradictions x
               LEFT JOIN clients c ON c.id = x.client_id
              WHERE x.resolved_at IS NULL
                AND ($2::text IS NULL OR x.client_id = $2)
              ORDER BY x.detected_at DESC
              LIMIT $1`,
            [limit, clientId ?? null],
          );
          return rows.map((r) => ({
            id: r.id,
            client_id: r.client_id,
            contradiction_type: r.contradiction_type,
            severity: r.severity,
            description: r.description,
            detected_at: r.detected_at,
            triggered_engagement_id: r.triggered_engagement_id,
            client:
              r.c_id !== null && r.c_name !== null
                ? { id: r.c_id, name: r.c_name }
                : null,
          }));
        });
      } catch {
        return [];
      }
    },
    async getActiveEngagements(clientId) {
      try {
        return await session((run) =>
          run<HomeEngagementRow>(
            `SELECT id, graph_node_id, name, current_phase, status,
                    updated_at, gates_passed, client_id
               FROM engagements
              WHERE status = 'active'
                AND ($2::text IS NULL OR client_id = $2)
              ORDER BY updated_at DESC
              LIMIT $1`,
            [ENGAGEMENT_SCAN_LIMIT, clientId ?? null],
          ),
        );
      } catch {
        return [];
      }
    },
    async getRecentTurns(engagementIds) {
      if (engagementIds.length === 0) return [];
      try {
        return await session((run) =>
          run<HomeTurnRow>(
            `SELECT engagement_id, sender, created_at
               FROM turns
              WHERE engagement_id = ANY($1::text[])
              ORDER BY created_at DESC
              LIMIT $2`,
            [engagementIds as string[], TURNS_SCAN_LIMIT],
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
export const supabaseHomeAttentionReadAdapter: HomeAttentionReadAdapter =
  createSupabaseHomeAttentionReadAdapter();
export const azureHomeAttentionReadAdapter: HomeAttentionReadAdapter =
  createAzureHomeAttentionReadAdapter();

/** Select the Home-attention read adapter for the configured data plane. */
export function selectHomeAttentionReadAdapter(
  plane?: DataPlane,
): HomeAttentionReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureHomeAttentionReadAdapter
    : supabaseHomeAttentionReadAdapter;
}
