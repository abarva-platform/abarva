// Strategic Moves preferences read adapter (Slice 7 — Moves server-component
// read paths).
//
// Backs the per-user view preference read the `/strategic-moves` server
// component performs via `getStrategicMovesPreferences`. That helper reads
// ONE `default_filters` JSON column from `tower_user_preferences`, scoped to
// `(person_id, client_id)`. The shape-validation / default-fallback logic is
// pure presentation maths and stays in `strategic-moves-preferences.ts`; the
// ONE thing the data plane owns is the physical column read.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST read (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL read (opt-in)
//
// The adapter returns the raw `default_filters` value (`unknown`, since the
// column is freeform JSON) — exactly what `getStrategicMovesPreferences`
// consumed from `data.default_filters` pre-seam — so the helper signature and
// `StrategicMovesPreferences` return shape are byte-identical and every
// caller keeps working unchanged.
//
// NOTE: this read is intentionally NOT a Tower-domain migration. Although the
// row lives in `tower_user_preferences`, only the Moves slice of the
// `default_filters` JSON (`strategic_moves`) is consumed here, and the helper
// is a Moves/programs-query file. The Tower surface owns its own preference
// reads separately.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A Strategic-Moves preferences read adapter for one physical data plane. */
export interface StrategicMovesPreferencesReadAdapter {
  readonly name: DataPlane;
  /**
   * Read the raw `default_filters` JSON value for `(personId, clientId)`,
   * or `null` when no preference row exists. Returns the column verbatim —
   * shape validation is the caller's job. Pre-seam the helper swallowed read
   * errors implicitly (it only destructured `data`), so adapters return
   * `null` on a missing row rather than throwing.
   */
  getDefaultFilters(personId: string, clientId: string): Promise<unknown>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Strategic-Moves preferences adapter. The query is the
 * exact `.from('tower_user_preferences').select('default_filters')
 * .eq('person_id', ...).eq('client_id', ...).maybeSingle()` the pre-seam
 * helper ran, so the returned value is byte-identical.
 */
export function createSupabaseStrategicMovesPreferencesReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): StrategicMovesPreferencesReadAdapter {
  return {
    name: 'supabase',
    async getDefaultFilters(personId, clientId) {
      const sb = getClient();
      const { data } = await sb
        .from('tower_user_preferences')
        .select('default_filters')
        .eq('person_id', personId)
        .eq('client_id', clientId)
        .maybeSingle();
      return (data as { default_filters?: unknown } | null)?.default_filters ?? null;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Strategic-Moves preferences adapter. The
 * PostgREST `.maybeSingle()` becomes a `LIMIT 1` SQL read with identical
 * `(person_id, client_id)` predicates. The session runner is injectable so
 * tests drive an in-memory fake.
 */
export function createAzureStrategicMovesPreferencesReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-strategic-moves-preferences'),
): StrategicMovesPreferencesReadAdapter {
  return {
    name: 'azure-postgres',
    async getDefaultFilters(personId, clientId) {
      return session(async (run) => {
        const rows = await run<{ default_filters: unknown }>(
          'SELECT default_filters FROM tower_user_preferences '
          + 'WHERE person_id = $1 AND client_id = $2 LIMIT 1',
          [personId, clientId],
        );
        return rows[0]?.default_filters ?? null;
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseStrategicMovesPreferencesReadAdapter: StrategicMovesPreferencesReadAdapter =
  createSupabaseStrategicMovesPreferencesReadAdapter();
export const azureStrategicMovesPreferencesReadAdapter: StrategicMovesPreferencesReadAdapter =
  createAzureStrategicMovesPreferencesReadAdapter();

/** Select the Strategic-Moves preferences read adapter for the configured plane. */
export function selectStrategicMovesPreferencesReadAdapter(
  plane?: DataPlane,
): StrategicMovesPreferencesReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureStrategicMovesPreferencesReadAdapter
    : supabaseStrategicMovesPreferencesReadAdapter;
}
