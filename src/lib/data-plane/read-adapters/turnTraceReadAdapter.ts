// Turn-trace read adapter (Slice 2).
//
// Backs `GET /api/turn/[turnId]/trace`. The read is tenant-scoped: a turn's
// trace is only returned if the owning engagement belongs to the caller's
// `clientId`. That join MUST stay inside the adapter so the tenancy boundary
// is enforced identically on both data planes — without it, any caller with
// a turn UUID could read another tenant's reasoning trace.
//
// Selected by the same `ABARVA_DATA_PLANE` switch as Slice 1.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A turn trace row, join column stripped — the route's response payload. */
export interface TurnTraceRow {
  turn_id: string;
  engagement_id: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  steps: unknown;
  created_at: string;
}

/** Outcome of a turn-trace lookup. */
export type TurnTraceResult =
  | { kind: 'ok'; trace: TurnTraceRow }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

/** A turn-trace read adapter for one physical data plane. */
export interface TurnTraceReadAdapter {
  readonly name: DataPlane;
  /**
   * Fetch the trace for `turnId`, but only if its engagement belongs to
   * `clientId`. Returns `not_found` for a missing OR cross-tenant turn —
   * the two are deliberately indistinguishable so a caller cannot probe for
   * the existence of another tenant's turns.
   */
  getTurnTrace(turnId: string, clientId: string): Promise<TurnTraceResult>;
}

const TRACE_COLUMNS =
  'turn_id, engagement_id, model, input_tokens, output_tokens, latency_ms, steps, created_at';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase turn-trace adapter. Query logic lifted verbatim from
 * `/api/turn/[turnId]/trace` — the `engagements!inner` join enforces tenancy.
 */
export function createSupabaseTurnTraceReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): TurnTraceReadAdapter {
  return {
    name: 'supabase',
    async getTurnTrace(turnId, clientId) {
      const sb = getClient();
      const { data, error } = await sb
        .from('turn_traces')
        .select(`${TRACE_COLUMNS}, engagements!inner(client_id)`)
        .eq('turn_id', turnId)
        .eq('engagements.client_id', clientId)
        .maybeSingle();
      if (error) return { kind: 'error', message: error.message };
      if (!data) return { kind: 'not_found' };
      // Strip the join column before returning.
      const { engagements, ...trace } = data as Record<string, unknown> & {
        engagements?: unknown;
      };
      void engagements;
      return { kind: 'ok', trace: trace as unknown as TurnTraceRow };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres turn-trace adapter. The tenancy join is expressed
 * as an inner join on `engagements`; session runner is injectable for tests.
 */
export function createAzureTurnTraceReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-turn-trace'),
): TurnTraceReadAdapter {
  return {
    name: 'azure-postgres',
    async getTurnTrace(turnId, clientId) {
      try {
        return await session(async (run) => {
          const rows = await run<TurnTraceRow>(
            `SELECT ${TRACE_COLUMNS.split(', ').map((c) => `t.${c}`).join(', ')} `
            + 'FROM turn_traces t '
            + 'JOIN engagements e ON e.id = t.engagement_id '
            + 'WHERE t.turn_id = $1 AND e.client_id = $2 '
            + 'LIMIT 1',
            [turnId, clientId],
          );
          const row = rows[0];
          if (!row) return { kind: 'not_found' };
          return { kind: 'ok', trace: row };
        });
      } catch (err) {
        return {
          kind: 'error',
          message: err instanceof Error ? err.message : 'unknown',
        };
      }
    },
  };
}

// --- Selection -------------------------------------------------------------

export const supabaseTurnTraceReadAdapter: TurnTraceReadAdapter =
  createSupabaseTurnTraceReadAdapter();
export const azureTurnTraceReadAdapter: TurnTraceReadAdapter =
  createAzureTurnTraceReadAdapter();

/** Select the turn-trace read adapter for the configured data plane. */
export function selectTurnTraceReadAdapter(plane?: DataPlane): TurnTraceReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureTurnTraceReadAdapter
    : supabaseTurnTraceReadAdapter;
}
