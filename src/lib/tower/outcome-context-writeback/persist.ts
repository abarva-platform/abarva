// Tower → Outcome → Context write-back · Wave 3, Slice 3.7 · persist.
//
// The thin I/O seam that lands a built `OutcomeLearningContextRow` into
// the tenant Context layer (`enterprise_context_records`). The pure
// builder (`build-writeback.ts`) decides WHAT to write; this module
// only commits it.
//
// IDEMPOTENT BY CONSTRUCTION. The write is an `upsert` keyed on the
// table's `(tenant_key, canonical_record_id)` unique constraint, and
// `canonical_record_id` is derived deterministically from the source
// ledger entry id. Re-running loop closure for the same outcome
// overwrites the same Context record rather than duplicating it.
//
// TENANT-SCOPED. `enterprise_context_records` has RLS enabled with the
// canonical `can_read_tenant_by_key` / `can_write_tenant_by_key`
// helpers (see 20260514100000_enterprise_context_layer.sql). This
// module performs the write on the service role from application code,
// the same posture as the 3.1 / 3.6 ledger writes.

import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import { buildOutcomeContextWriteback } from './build-writeback';
import {
  OUTCOME_LEARNING_CONTEXT_TABLE,
  type OutcomeLearningContextRow,
} from './types';

/**
 * The minimal upsert surface this module needs from a backing store —
 * a structural subset of the Supabase client. Declared as an interface
 * so tests inject a fake without a live backend and without dragging in
 * the full `SupabaseClient` type surface.
 */
export interface ContextWritebackStore {
  upsertOutcomeLearning(
    table: string,
    row: OutcomeLearningContextRow,
    onConflict: string,
  ): Promise<{ ok: boolean; error?: string }>;
}

/** Conflict target — the table's tenant-scoped natural key. */
const ON_CONFLICT = 'tenant_key,canonical_record_id';

/**
 * Adapt the Supabase client into the {@link ContextWritebackStore}
 * shape. Kept private; `writeOutcomeLearningToContext` constructs it by
 * default so callers never touch Supabase directly.
 */
function supabaseContextWritebackStore(): ContextWritebackStore {
  return {
    async upsertOutcomeLearning(table, row, onConflict) {
      const { error } = await getServerSupabase()
        .from(table)
        .upsert(row, { onConflict });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
  };
}

/** The outcome of a loop-closure write-back attempt. */
export type OutcomeContextWritebackResult =
  /** Row not yet at a verified/realized rung — loop intentionally open. */
  | { readonly status: 'skipped'; readonly reason: 'not_resolved' }
  /** Learning landed in the Context layer — the loop is now closed. */
  | { readonly status: 'written'; readonly canonicalRecordId: string }
  /** Backing-store rejected the write — loop stays open, caller retries. */
  | { readonly status: 'failed'; readonly detail: string };

/**
 * Close the decision loop for one outcome-ledger entry: project it into
 * an `outcome_learning` Context record and upsert it into the tenant
 * Context layer. A future Intelligence query for that tenant is then
 * grounded in "this bet was made, and here is what actually happened".
 *
 * A row that has not yet reached a verified / realized (or declined)
 * rung is `skipped` — the loop is meant to stay open until the outcome
 * is real. This is not an error.
 *
 * @param row    a persisted `outcome_ledger` row (read, never mutated).
 * @param store  optional backing-store override (defaults to Supabase).
 */
export async function writeOutcomeLearningToContext(
  row: OutcomeLedgerRow,
  store: ContextWritebackStore = supabaseContextWritebackStore(),
): Promise<OutcomeContextWritebackResult> {
  const plan = buildOutcomeContextWriteback(row);
  if (!plan.written) {
    return { status: 'skipped', reason: plan.reason };
  }

  // Canonicalize the tenant key on the way in — same posture as the
  // read seam — so the Context record is keyed consistently.
  const persisted: OutcomeLearningContextRow = {
    ...plan.row,
    tenant_key: canonicalTenantKey(plan.row.tenant_key),
  };

  const result = await store.upsertOutcomeLearning(
    OUTCOME_LEARNING_CONTEXT_TABLE,
    persisted,
    ON_CONFLICT,
  );

  if (!result.ok) {
    return { status: 'failed', detail: result.error ?? 'unknown write error' };
  }
  return { status: 'written', canonicalRecordId: persisted.canonical_record_id };
}

/**
 * Close the loop for a batch of ledger rows. Each row is attempted
 * independently; a failure on one does not abort the rest. Returns one
 * result per input row, order preserved.
 */
export async function writeOutcomeLearningBatchToContext(
  rows: readonly OutcomeLedgerRow[],
  store: ContextWritebackStore = supabaseContextWritebackStore(),
): Promise<readonly OutcomeContextWritebackResult[]> {
  const out: OutcomeContextWritebackResult[] = [];
  for (const row of rows) {
    out.push(await writeOutcomeLearningToContext(row, store));
  }
  return out;
}
