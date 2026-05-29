// Engagement-turn write adapter (Slice 3d).
//
// Backs the DB write of `POST /api/engage/[engagementId]/turn` — the single
// `turns` insert that persists one conversation turn. The route owns auth, the
// fail-closed role gate, the LLM stream orchestration, gate-approval detection
// and every background capture loop; this adapter owns ONLY the physical
// `turns` row insert so the backing store becomes selectable for the Azure
// parallel-run cutover.
//
// Why a per-domain adapter and not `appendTurn` from `@/lib/db/turn`:
// `appendTurn` is also called by `lib/deliverables/{live-sync,v2-generator,
// generate}.ts`, which are NOT in Slice 3d. Migrating the shared helper would
// reach outside this slice, so per the slice rule the migration happens at the
// route boundary — the route calls this adapter; other callers keep `appendTurn`.
//
// The produced row is byte-faithful to the pre-seam `appendTurn` `.insert()`
// body: identical snake_case columns, identical values, the same `TurnRow`
// shape returned. Default behavior is unchanged — `ABARVA_DATA_PLANE` selects
// the plane, `supabase` unless explicitly opted out.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

const TURNS_TABLE = 'turns';

/** A persisted conversation turn — mirrors `TurnRow` in `@/lib/db/turn`. */
export interface PersistedTurnRow {
  id: string;
  engagement_id: string;
  phase: number;
  sender: 'agent' | 'user';
  text: string;
  mode_label: string | null;
  retrieved_refs: Record<string, unknown>;
  created_at: string;
}

/** The turn to persist — the route supplies these, the adapter writes the row. */
export interface AppendTurnInput {
  engagementId: string;
  phase: number;
  sender: 'agent' | 'user';
  text: string;
  modeLabel?: string | null;
  retrievedRefs?: Record<string, unknown>;
}

/** An engagement-turn write adapter bound to one physical data plane. */
export interface EngageTurnWriteAdapter {
  readonly name: DataPlane;
  /** Insert one `turns` row and return the persisted row. */
  appendTurn(input: AppendTurnInput): Promise<PersistedTurnRow>;
}

/** Snake_case row body — the single source of truth for both planes. */
function turnColumns(input: AppendTurnInput): Record<string, unknown> {
  return {
    engagement_id: input.engagementId,
    phase: input.phase,
    sender: input.sender,
    text: input.text,
    mode_label: input.modeLabel ?? null,
    retrieved_refs: input.retrievedRefs ?? {},
  };
}

/**
 * Supabase engagement-turn write adapter — the DEFAULT path. Uses the native
 * service-role client, exactly as the pre-seam `appendTurn` did.
 */
export function createSupabaseEngageTurnWriteAdapter(
  getClient: () => SupabaseClient = getAzureWriteFluentClient,
): EngageTurnWriteAdapter {
  return {
    name: 'supabase',
    async appendTurn(input) {
      const { data, error } = await getClient()
        .from(TURNS_TABLE)
        .insert(turnColumns(input))
        .select()
        .single();
      if (error) throw error;
      return data as PersistedTurnRow;
    },
  };
}

/**
 * Azure Postgres engagement-turn write adapter — opt-in cutover/rehearsal path.
 * The single insert runs inside a real `BEGIN`/`COMMIT` transaction.
 */
export function createAzureEngageTurnWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-engage-turn-write'),
): EngageTurnWriteAdapter {
  return {
    name: 'azure-postgres',
    async appendTurn(input) {
      const columns = turnColumns(input);
      const keys = Object.keys(columns);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => columns[k]);
      const sql =
        `INSERT INTO ${TURNS_TABLE} (${keys.join(', ')}) `
        + `VALUES (${placeholders}) RETURNING *`;
      const rows = await session(async (run) =>
        run<PersistedTurnRow>(sql, values),
      );
      if (!rows[0]) throw new Error('engage_turn_insert_returned_no_row');
      return rows[0];
    },
  };
}

/**
 * Select the engagement-turn write adapter for the configured (or explicitly
 * passed) plane. Defaults to Supabase — production write behavior unchanged.
 */
export function selectEngageTurnWriteAdapter(
  plane?: DataPlane,
): EngageTurnWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureEngageTurnWriteAdapter()
    : createSupabaseEngageTurnWriteAdapter();
}
