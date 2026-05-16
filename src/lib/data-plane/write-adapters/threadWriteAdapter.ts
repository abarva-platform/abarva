// Intelligence-thread domain write adapter (write seam — Slice 3f).
//
// Backs the physical `intelligence_threads` UPDATE inside the shared helper
// `attachThreadToEngagement` (src/lib/intelligence/db/threadRepository.ts) —
// the write behind `POST /api/v1/threads/:threadId/attach`. The helper is a
// shared `src/lib` repository, so Slice 3c could not migrate it without a
// merge collision; that risk is gone now (design doc §4).
//
// The helper keeps its tenancy assertion and signature; the adapter owns ONLY
// the physical UPDATE. The update is keyed by `id` + `client_id` + `user_id`,
// exactly the per-user RLS scope the pre-seam helper used. Supabase stays the
// default; `azure-postgres` is opt-in via `ABARVA_DATA_PLANE` and runs the
// update inside a real `BEGIN`/`COMMIT` (design doc §2).

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

// --- write input ------------------------------------------------------------

/** Inputs to stamp `attached_engagement_id` on an intelligence thread. */
export interface AttachThreadUpdateInput {
  readonly threadId: string;
  readonly engagementId: string;
  /** Per-user RLS scope — both ride the WHERE clause, as the pre-seam helper. */
  readonly clientId: string;
  readonly userId: string;
}

/** A write outcome — `ok:false` carries an error the helper turns into a throw. */
export interface ThreadWriteOutcome {
  readonly ok: boolean;
  readonly error?: string;
}

// --- adapter contract -------------------------------------------------------

/** The intelligence-thread write adapter for one physical data plane. */
export interface ThreadWriteAdapter {
  readonly name: DataPlane;
  /**
   * Stamp `attached_engagement_id` on a thread, scoped by client + user. On a
   * DB error returns `ok:false` — the helper re-throws, matching the pre-seam
   * behavior exactly.
   */
  attachThreadToEngagement(input: AttachThreadUpdateInput): Promise<ThreadWriteOutcome>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase thread write adapter. The `.update().eq()` chain is the
 * verbatim pre-seam call. The client factory is injectable for tests.
 */
export function createSupabaseThreadWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): ThreadWriteAdapter {
  return {
    name: 'supabase',

    async attachThreadToEngagement(input) {
      const { error } = await getClient()
        .from('intelligence_threads')
        .update({ attached_engagement_id: input.engagementId })
        .eq('id', input.threadId)
        .eq('client_id', input.clientId)
        .eq('user_id', input.userId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres thread write adapter. Mirrors the Supabase row
 * scope column-for-column; the UPDATE runs inside a real `BEGIN`/`COMMIT`.
 * The session is injectable for tests.
 */
export function createAzureThreadWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-thread-write'),
): ThreadWriteAdapter {
  return {
    name: 'azure-postgres',

    async attachThreadToEngagement(input) {
      try {
        await session((run) =>
          run(
            'UPDATE intelligence_threads SET attached_engagement_id = $1 '
              + 'WHERE id = $2 AND client_id = $3 AND user_id = $4',
            [input.engagementId, input.threadId, input.clientId, input.userId],
          ),
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}

// --- selection --------------------------------------------------------------

/**
 * Select the intelligence-thread write adapter for the configured (or
 * explicitly passed) plane. Defaults to Supabase — production write is unchanged.
 */
export function selectThreadWriteAdapter(plane?: DataPlane): ThreadWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureThreadWriteAdapter()
    : createSupabaseThreadWriteAdapter();
}
