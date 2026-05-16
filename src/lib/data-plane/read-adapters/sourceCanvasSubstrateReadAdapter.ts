// Source canvas-substrate read adapter (Slice 8 — Source server-component
// read paths).
//
// Backs the three per-event canvas-substrate reads in
// `src/lib/source/canvas-substrate/queries.ts`:
//   - `listArtifactStatesForEvent`        -> source_event_artifact_states
//   - `listGateCriterionStatesForEvent`   -> source_event_gate_criterion_states
//   - `listEvidenceStatesForEvent`        -> source_event_evidence_states
//
// These feed the universal Source event canvas (gate panel, artifact shelf,
// evidence drawer) rendered by the `/source/events/[eventId]` server
// component family.
//
// The adapter owns ONLY the physical table read scoped to `source_event_id`.
// The `*RowToView` snake_case -> camelCase transforms and the per-stage
// filtering stay lib-side so the view-model mapping is not duplicated across
// data planes.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST read (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL read (opt-in)
//
// The adapter returns the raw `*Row` projections — exactly the shape
// `queries.ts` consumed pre-seam (`SELECT *`) — so every helper signature
// and return shape is byte-identical and all callers keep working unchanged.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import type {
  SourceEventArtifactStateRow,
  SourceEventEvidenceStateRow,
  SourceEventGateCriterionStateRow,
} from '@/lib/source/canvas-substrate/types';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A Source canvas-substrate read adapter for one physical data plane. */
export interface SourceCanvasSubstrateReadAdapter {
  readonly name: DataPlane;
  /**
   * Read every `source_event_artifact_states` row for `sourceEventId`,
   * ordered by `artifact_code`. Throws on a read failure — the lib helper
   * catches and degrades to `[]`, so callers' behavior is preserved.
   */
  listArtifactStateRows(sourceEventId: string): Promise<SourceEventArtifactStateRow[]>;
  /**
   * Read every `source_event_gate_criterion_states` row for `sourceEventId`,
   * ordered by `criterion_id`. Throws on a read failure.
   */
  listGateCriterionStateRows(
    sourceEventId: string,
  ): Promise<SourceEventGateCriterionStateRow[]>;
  /**
   * Read every `source_event_evidence_states` row for `sourceEventId`,
   * ordered by `requirement_id`. Throws on a read failure.
   */
  listEvidenceStateRows(sourceEventId: string): Promise<SourceEventEvidenceStateRow[]>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase canvas-substrate adapter. Each query is the exact
 * `.from(...).select('*').eq('source_event_id', ...).order(...)` chain the
 * pre-seam helpers ran, so the returned rows are byte-identical. A query
 * error throws with the pre-seam `[helper]`-prefixed message; the lib helper
 * already catches it and returns `[]`.
 */
export function createSupabaseSourceCanvasSubstrateReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): SourceCanvasSubstrateReadAdapter {
  return {
    name: 'supabase',
    async listArtifactStateRows(sourceEventId) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_event_artifact_states')
        .select('*')
        .eq('source_event_id', sourceEventId)
        .order('artifact_code', { ascending: true });
      if (error) throw new Error(`listArtifactStatesForEvent: ${error.message}`);
      return (data as SourceEventArtifactStateRow[] | null) ?? [];
    },
    async listGateCriterionStateRows(sourceEventId) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_event_gate_criterion_states')
        .select('*')
        .eq('source_event_id', sourceEventId)
        .order('criterion_id', { ascending: true });
      if (error) throw new Error(`listGateCriterionStatesForEvent: ${error.message}`);
      return (data as SourceEventGateCriterionStateRow[] | null) ?? [];
    },
    async listEvidenceStateRows(sourceEventId) {
      const sb = getClient();
      const { data, error } = await sb
        .from('source_event_evidence_states')
        .select('*')
        .eq('source_event_id', sourceEventId)
        .order('requirement_id', { ascending: true });
      if (error) throw new Error(`listEvidenceStatesForEvent: ${error.message}`);
      return (data as SourceEventEvidenceStateRow[] | null) ?? [];
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres canvas-substrate adapter. Each PostgREST chain
 * becomes the equivalent parameterized SQL with the same `ORDER BY` —
 * identical row semantics. The session runner is injectable so tests drive
 * an in-memory fake.
 */
export function createAzureSourceCanvasSubstrateReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-source-canvas'),
): SourceCanvasSubstrateReadAdapter {
  return {
    name: 'azure-postgres',
    async listArtifactStateRows(sourceEventId) {
      return session((run) =>
        run<SourceEventArtifactStateRow>(
          `SELECT * FROM source_event_artifact_states
            WHERE source_event_id = $1 ORDER BY artifact_code ASC`,
          [sourceEventId],
        ),
      );
    },
    async listGateCriterionStateRows(sourceEventId) {
      return session((run) =>
        run<SourceEventGateCriterionStateRow>(
          `SELECT * FROM source_event_gate_criterion_states
            WHERE source_event_id = $1 ORDER BY criterion_id ASC`,
          [sourceEventId],
        ),
      );
    },
    async listEvidenceStateRows(sourceEventId) {
      return session((run) =>
        run<SourceEventEvidenceStateRow>(
          `SELECT * FROM source_event_evidence_states
            WHERE source_event_id = $1 ORDER BY requirement_id ASC`,
          [sourceEventId],
        ),
      );
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseSourceCanvasSubstrateReadAdapter: SourceCanvasSubstrateReadAdapter =
  createSupabaseSourceCanvasSubstrateReadAdapter();
export const azureSourceCanvasSubstrateReadAdapter: SourceCanvasSubstrateReadAdapter =
  createAzureSourceCanvasSubstrateReadAdapter();

/** Select the canvas-substrate read adapter for the configured data plane. */
export function selectSourceCanvasSubstrateReadAdapter(
  plane?: DataPlane,
): SourceCanvasSubstrateReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureSourceCanvasSubstrateReadAdapter
    : supabaseSourceCanvasSubstrateReadAdapter;
}
