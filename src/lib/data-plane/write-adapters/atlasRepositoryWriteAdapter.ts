// Atlas repository write adapter (Slice 9 — write side of src/lib/atlas/repository.ts).
//
// The companion `read-adapters/atlasRepositoryReadAdapter.ts` owns every
// physical READ the repository issues; this adapter owns every physical WRITE:
// the Atlas thread insert, the thread `last_message_at` touch, the message
// trace insert, the reasoning-trace insert, and the observation insert.
//
// It follows the SAME per-domain plane-split pattern `programsWriteAdapter.ts`
// established: a narrow domain interface with a `supabase` (default, native
// client) implementation and an `azure-postgres` (opt-in, `createTxSession` +
// SQL) implementation, switched by `resolveDataPlane()`.
//
// WHY a per-domain adapter rather than the generic `commit()`: the generic
// `commit()` is Azure-only by design (the Supabase plane lacks a client-side
// transaction and the cutover-flip strategy avoids a SQL-exec RPC). The Atlas
// repository's writes are plain inserts/updates the pre-seam code issued
// directly on Supabase, so — exactly as `programsWriteAdapter.ts` does — this
// module exposes them as native per-domain operations. On Azure each runs
// inside one `BEGIN`/`COMMIT` (`createTxSession`); on Supabase they are the
// same single statements the pre-seam repository ran — behavior is identical.
//
// The seam owns ONLY the physical DB write. Citation validation, turn-index
// resolution (a READ — handled by the read adapter), and error re-throwing
// stay in the repository, which orchestrates the read + write adapters.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

type JsonObject = Record<string, unknown>;

// --- write inputs ----------------------------------------------------------

/** Insert a new `atlas_threads` row. */
export interface AtlasThreadInsert {
  readonly clientId: string;
  readonly personId: string | null;
  readonly title: string | null;
  readonly signalFiringId: string | null;
  readonly contextScope: 'signal' | 'portfolio';
  readonly lastMessageAtIso: string;
}

/** Insert one `atlas_message_traces` row at a resolved turn index. */
export interface AtlasMessageTraceInsert {
  readonly atlasThreadId: string;
  readonly atlasObservationId: string | null;
  readonly turnIndex: number;
  readonly role: 'user' | 'atlas' | 'system';
  readonly routeType: string;
  readonly contentJsonb: JsonObject;
  readonly toolsUsed: readonly string[];
  readonly modelName: string | null;
  readonly promptVersion: string | null;
  readonly latencyMs: number | null;
}

/** Insert one `atlas_reasoning_traces` row. Column body is pre-shaped. */
export interface AtlasReasoningTraceInsert {
  readonly traceId: string;
  readonly threadId: string | null;
  readonly tenantId: string;
  readonly userId: string | null;
  readonly trigger: string;
  readonly inputSummary: JsonObject;
  readonly patternsFired: readonly string[];
  readonly patternsSkipped: ReadonlyArray<{ pattern: string; reason: string }>;
  readonly observations: ReadonlyArray<JsonObject>;
  readonly ifYouOnlyDoOne: string | null;
  readonly citations: ReadonlyArray<JsonObject>;
  readonly interpretationConfidence: string;
  readonly fallbackUsed: boolean;
  readonly fallbackReason: string | null;
  readonly latencyMs: number | null;
  readonly promptTokens: number | null;
  readonly completionTokens: number | null;
  readonly model: string;
  readonly promptVersion: string;
  readonly packageVersion: string;
}

/** Insert one `atlas_observations` row. */
export interface AtlasObservationInsert {
  readonly clientId: string;
  readonly atlasThreadId: string | null;
  readonly signalFiringId: string | null;
  readonly pillar: string | null;
  readonly observationKind: string;
  readonly severity: string | null;
  readonly summary: string;
  readonly detailsJsonb: JsonObject;
  readonly routeType: string;
}

/** A write outcome carrying inserted data or an error to re-throw. */
export interface AtlasWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * The Atlas-repository write adapter for one physical data plane. Each method
 * is a thin physical write; the repository owns validation, the turn-index
 * read, and turning a failed outcome back into a throw.
 */
export interface AtlasRepositoryWriteAdapter {
  readonly name: DataPlane;
  /** Insert a new Atlas thread; `data.id` is the new row id. */
  insertThread(input: AtlasThreadInsert): Promise<AtlasWriteOutcome<{ id: string }>>;
  /**
   * Stamp `last_message_at` on a thread. Best-effort — the pre-seam
   * `touchAtlasThread` ignored the result; this resolves to `void`.
   */
  touchThread(threadId: string, lastMessageAtIso: string): Promise<void>;
  /** Insert one message trace row. `ok:false` carries the error to re-throw. */
  insertMessageTrace(input: AtlasMessageTraceInsert): Promise<AtlasWriteOutcome<void>>;
  /** Insert one reasoning-trace row. `ok:false` carries the error to re-throw. */
  insertReasoningTrace(input: AtlasReasoningTraceInsert): Promise<AtlasWriteOutcome<void>>;
  /** Insert one observation row; `data.id` is the new row id. */
  insertObservation(input: AtlasObservationInsert): Promise<AtlasWriteOutcome<{ id: string }>>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Atlas-repository write adapter. Insert/update logic is
 * lifted verbatim from the pre-seam repository, so the produced rows are
 * byte-identical. The client factory is injectable for tests.
 */
export function createSupabaseAtlasRepositoryWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
): AtlasRepositoryWriteAdapter {
  return {
    name: 'supabase',

    async insertThread(input) {
      const { data, error } = await getClient()
        .from('atlas_threads')
        .insert({
          client_id: input.clientId,
          person_id: input.personId,
          title: input.title,
          signal_firing_id: input.signalFiringId,
          context_scope: input.contextScope,
          last_message_at: input.lastMessageAtIso,
        })
        .select('id')
        .single();
      if (error || !data) {
        return { ok: false, error: error?.message ?? 'Failed to create Atlas thread' };
      }
      return { ok: true, data: { id: (data as { id: string }).id } };
    },

    async touchThread(threadId, lastMessageAtIso) {
      await getClient()
        .from('atlas_threads')
        .update({ last_message_at: lastMessageAtIso })
        .eq('id', threadId);
    },

    async insertMessageTrace(input) {
      const { error } = await getClient()
        .from('atlas_message_traces')
        .insert({
          atlas_thread_id: input.atlasThreadId,
          atlas_observation_id: input.atlasObservationId,
          turn_index: input.turnIndex,
          role: input.role,
          route_type: input.routeType,
          content_jsonb: input.contentJsonb,
          tools_used: input.toolsUsed,
          model_name: input.modelName,
          prompt_version: input.promptVersion,
          latency_ms: input.latencyMs,
        });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },

    async insertReasoningTrace(input) {
      const { error } = await getClient()
        .from('atlas_reasoning_traces')
        .insert({
          trace_id: input.traceId,
          thread_id: input.threadId,
          tenant_id: input.tenantId,
          user_id: input.userId,
          trigger: input.trigger,
          input_summary: input.inputSummary,
          patterns_fired: input.patternsFired,
          patterns_skipped: input.patternsSkipped,
          observations: input.observations,
          if_you_only_do_one: input.ifYouOnlyDoOne,
          citations: input.citations,
          interpretation_confidence: input.interpretationConfidence,
          fallback_used: input.fallbackUsed,
          fallback_reason: input.fallbackReason,
          latency_ms: input.latencyMs,
          prompt_tokens: input.promptTokens,
          completion_tokens: input.completionTokens,
          model: input.model,
          prompt_version: input.promptVersion,
          package_version: input.packageVersion,
        });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },

    async insertObservation(input) {
      const { data, error } = await getClient()
        .from('atlas_observations')
        .insert({
          client_id: input.clientId,
          atlas_thread_id: input.atlasThreadId,
          signal_firing_id: input.signalFiringId,
          pillar: input.pillar,
          observation_kind: input.observationKind,
          severity: input.severity,
          summary: input.summary,
          details_jsonb: input.detailsJsonb,
          route_type: input.routeType,
        })
        .select('id')
        .single();
      if (error || !data) {
        return { ok: false, error: error?.message ?? 'Failed to create observation' };
      }
      return { ok: true, data: { id: (data as { id: string }).id } };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Atlas-repository write adapter. Mirrors the
 * Supabase semantics column-for-column; each operation runs inside a real
 * `BEGIN`/`COMMIT` (`createTxSession`). The session runner is injectable.
 */
export function createAzureAtlasRepositoryWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-atlas-repository-write'),
): AtlasRepositoryWriteAdapter {
  return {
    name: 'azure-postgres',

    async insertThread(input) {
      try {
        const rows = await session((run) =>
          run<{ id: string }>(
            `INSERT INTO atlas_threads
               (client_id, person_id, title, signal_firing_id, context_scope, last_message_at)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              input.clientId,
              input.personId,
              input.title,
              input.signalFiringId,
              input.contextScope,
              input.lastMessageAtIso,
            ],
          ),
        );
        const id = rows[0]?.id;
        if (!id) return { ok: false, error: 'Atlas thread insert returned no id' };
        return { ok: true, data: { id } };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async touchThread(threadId, lastMessageAtIso) {
      try {
        await session((run) =>
          run(
            'UPDATE atlas_threads SET last_message_at = $1 WHERE id = $2',
            [lastMessageAtIso, threadId],
          ),
        );
      } catch {
        // Pre-seam `touchAtlasThread` ignored the result; stay best-effort.
      }
    },

    async insertMessageTrace(input) {
      try {
        await session((run) =>
          run(
            `INSERT INTO atlas_message_traces
               (atlas_thread_id, atlas_observation_id, turn_index, role, route_type,
                content_jsonb, tools_used, model_name, prompt_version, latency_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              input.atlasThreadId,
              input.atlasObservationId,
              input.turnIndex,
              input.role,
              input.routeType,
              input.contentJsonb,
              input.toolsUsed,
              input.modelName,
              input.promptVersion,
              input.latencyMs,
            ],
          ),
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async insertReasoningTrace(input) {
      try {
        await session((run) =>
          run(
            `INSERT INTO atlas_reasoning_traces
               (trace_id, thread_id, tenant_id, user_id, trigger, input_summary,
                patterns_fired, patterns_skipped, observations, if_you_only_do_one,
                citations, interpretation_confidence, fallback_used, fallback_reason,
                latency_ms, prompt_tokens, completion_tokens, model, prompt_version,
                package_version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                     $15, $16, $17, $18, $19, $20)`,
            [
              input.traceId,
              input.threadId,
              input.tenantId,
              input.userId,
              input.trigger,
              input.inputSummary,
              input.patternsFired,
              input.patternsSkipped,
              input.observations,
              input.ifYouOnlyDoOne,
              input.citations,
              input.interpretationConfidence,
              input.fallbackUsed,
              input.fallbackReason,
              input.latencyMs,
              input.promptTokens,
              input.completionTokens,
              input.model,
              input.promptVersion,
              input.packageVersion,
            ],
          ),
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async insertObservation(input) {
      try {
        const rows = await session((run) =>
          run<{ id: string }>(
            `INSERT INTO atlas_observations
               (client_id, atlas_thread_id, signal_firing_id, pillar, observation_kind,
                severity, summary, details_jsonb, route_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
              input.clientId,
              input.atlasThreadId,
              input.signalFiringId,
              input.pillar,
              input.observationKind,
              input.severity,
              input.summary,
              input.detailsJsonb,
              input.routeType,
            ],
          ),
        );
        const id = rows[0]?.id;
        if (!id) return { ok: false, error: 'Atlas observation insert returned no id' };
        return { ok: true, data: { id } };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}

// --- selection --------------------------------------------------------------

/**
 * Select the Atlas-repository write adapter for the configured (or explicitly
 * passed) plane. Defaults to Supabase — production write behavior is unchanged.
 */
export function selectAtlasRepositoryWriteAdapter(
  plane?: DataPlane,
): AtlasRepositoryWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureAtlasRepositoryWriteAdapter()
    : createSupabaseAtlasRepositoryWriteAdapter();
}
