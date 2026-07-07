// Source events read adapter (Slice 8 — Source server-component read paths).
//
// Backs the runtime tenant-scoped `source_events` reads in
// `src/lib/source/queries.ts` — the helpers that feed the `/source`
// portfolio page (`listSourcingEvents`), the events queue
// (`getPendingSourceEvents`), and the per-event detail route
// (`getPersistedSourceEventRow`, via `getSourcingEvent`).
//
// The adapter owns ONLY the physical `source_events` table read. RBAC
// scoping (`allowedSourceEventIdsForUser` / `canReadSourceEvent`), seed
// overlay merging, and the `sourceEventRowToSummary` / `...ToDetail`
// view-model transforms all stay lib-side so the access-policy logic is not
// duplicated across data planes.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST read (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL read (opt-in)
//
// The adapter returns the flat `SourceEventRow` projection — exactly the
// shape `queries.ts` consumed pre-seam (`SELECT *`) — so every helper
// signature and return shape is byte-identical and all callers keep working
// unchanged.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/**
 * One persisted `source_events` row — snake_case, untransformed. Mirrors the
 * `SourceEventRow` interface in `src/lib/source/queries.ts` field-for-field
 * so the lib's existing row-to-view-model transformers consume it unchanged.
 */
export interface SourceEventDbRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  event_type: string;
  current_stage_key: string;
  lifecycle_state: string;
  linked_program_id: string | null;
  estimated_value_usd: number | null;
  trigger_description: string | null;
  scope_description: string | null;
  decision_owner: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/** A Source-events read adapter for one physical data plane. */
export interface SourceEventsReadAdapter {
  readonly name: DataPlane;
  /**
   * Read `source_events` rows for `clientKey` whose `lifecycle_state` equals
   * `waiting_on_client`, newest first. Backs `getPendingSourceEvents`.
   */
  getPendingEventsForClient(clientKey: string): Promise<SourceEventDbRow[]>;
  /**
   * Read every non-archived `source_events` row for `clientKey`, newest
   * first. Backs the `listSourcingEvents` persisted overlay.
   */
  getActiveEventsForClient(clientKey: string): Promise<SourceEventDbRow[]>;
  /**
   * Resolve a single `source_events` row for `clientKey` by primary-key id.
   * Returns `null` when nothing matches. Backs the UUID fast path in
   * `getPersistedSourceEventRow`.
   */
  getEventByIdForClient(eventId: string, clientKey: string): Promise<SourceEventDbRow | null>;
  /**
   * Resolve a single `source_events` row for `clientKey` by `event_code`,
   * taking the most-recently-updated row when duplicate codes exist.
   * Returns `null` when nothing matches. Backs the by-code path in
   * `getPersistedSourceEventRow`.
   */
  getEventByCodeForClient(eventCode: string, clientKey: string): Promise<SourceEventDbRow | null>;
}

/** The `source_events` column projection — `SELECT *` lifted explicit. */
const SOURCE_EVENT_COLUMNS =
  'id, client_key, event_code, event_name, event_type, current_stage_key, '
  + 'lifecycle_state, linked_program_id, estimated_value_usd, trigger_description, '
  + 'scope_description, decision_owner, created_by_user_id, created_at, updated_at';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Source-events adapter. Each query is the exact
 * `.from('source_events')` chain the pre-seam helpers ran, so the returned
 * rows are byte-identical. Read failures resolve to `[]` / `null` — the
 * pre-seam helpers logged and degraded rather than throwing.
 */
export function createSupabaseSourceEventsReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): SourceEventsReadAdapter {
  return {
    name: 'supabase',
    async getPendingEventsForClient(clientKey) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_events')
        .select('*')
        .eq('client_key', clientKey)
        .eq('lifecycle_state', 'waiting_on_client')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[getPendingSourceEvents]', error.message);
        return [];
      }
      return (data as SourceEventDbRow[] | null) ?? [];
    },
    async getActiveEventsForClient(clientKey) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_events')
        .select('*')
        .eq('client_key', clientKey)
        .neq('lifecycle_state', 'archived')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[listSourcingEvents] source_events overlay failed', error.message);
        return [];
      }
      return (data as SourceEventDbRow[] | null) ?? [];
    },
    async getEventByIdForClient(eventId, clientKey) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_events')
        .select('*')
        .eq('id', eventId)
        .eq('client_key', clientKey)
        .maybeSingle();
      if (error) {
        console.error('[getPersistedSourceEventRow:id]', error.message);
        return null;
      }
      return (data as SourceEventDbRow | null) ?? null;
    },
    async getEventByCodeForClient(eventCode, clientKey) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_events')
        .select('*')
        .ilike('event_code', eventCode)
        .eq('client_key', clientKey)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) {
        console.error('[getPersistedSourceEventRow:code]', error.message);
        return null;
      }
      const rows = (data as SourceEventDbRow[] | null) ?? [];
      return rows[0] ?? null;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Source-events adapter. Each PostgREST chain
 * becomes the equivalent parameterized SQL — identical row semantics. A
 * query failure surfaces as a thrown error inside the session; the wrapping
 * methods catch it and degrade to `[]` / `null` like the Supabase path.
 * The session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureSourceEventsReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-source-events'),
): SourceEventsReadAdapter {
  return {
    name: 'azure-postgres',
    async getPendingEventsForClient(clientKey) {
      try {
        return await session((run) =>
          run<SourceEventDbRow>(
            `SELECT ${SOURCE_EVENT_COLUMNS} FROM source_events
              WHERE client_key = $1 AND lifecycle_state = 'waiting_on_client'
              ORDER BY created_at DESC`,
            [clientKey],
          ),
        );
      } catch (err) {
        console.error('[getPendingSourceEvents]', err instanceof Error ? err.message : err);
        return [];
      }
    },
    async getActiveEventsForClient(clientKey) {
      try {
        return await session((run) =>
          run<SourceEventDbRow>(
            `SELECT ${SOURCE_EVENT_COLUMNS} FROM source_events
              WHERE client_key = $1 AND lifecycle_state <> 'archived'
              ORDER BY created_at DESC`,
            [clientKey],
          ),
        );
      } catch (err) {
        console.error(
          '[listSourcingEvents] source_events overlay failed',
          err instanceof Error ? err.message : err,
        );
        return [];
      }
    },
    async getEventByIdForClient(eventId, clientKey) {
      try {
        const rows = await session((run) =>
          run<SourceEventDbRow>(
            `SELECT ${SOURCE_EVENT_COLUMNS} FROM source_events
              WHERE id = $1 AND client_key = $2 LIMIT 1`,
            [eventId, clientKey],
          ),
        );
        return rows[0] ?? null;
      } catch (err) {
        console.error('[getPersistedSourceEventRow:id]', err instanceof Error ? err.message : err);
        return null;
      }
    },
    async getEventByCodeForClient(eventCode, clientKey) {
      try {
        const rows = await session((run) =>
          run<SourceEventDbRow>(
            `SELECT ${SOURCE_EVENT_COLUMNS} FROM source_events
              WHERE lower(event_code) = lower($1) AND client_key = $2
              ORDER BY updated_at DESC LIMIT 1`,
            [eventCode, clientKey],
          ),
        );
        return rows[0] ?? null;
      } catch (err) {
        console.error('[getPersistedSourceEventRow:code]', err instanceof Error ? err.message : err);
        return null;
      }
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseSourceEventsReadAdapter: SourceEventsReadAdapter =
  createSupabaseSourceEventsReadAdapter();
export const azureSourceEventsReadAdapter: SourceEventsReadAdapter =
  createAzureSourceEventsReadAdapter();

/** Select the Source-events read adapter for the configured data plane. */
export function selectSourceEventsReadAdapter(plane?: DataPlane): SourceEventsReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureSourceEventsReadAdapter
    : supabaseSourceEventsReadAdapter;
}
