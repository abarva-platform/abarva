// Expert-reviews write adapter.
//
// Backs the persisted-write half of the Moves Expert Review Console: when an
// expert marks a verdict on a kernel business case, the console persists one
// append-only `expert_reviews` row (migration 20260519120000) through this
// seam. Reviews accumulate across 2–3 reviewers; the calibration engine reads
// the full set back.
//
// The Supabase adapter is the default — `ABARVA_DATA_PLANE` unset / `supabase`.
// `azure-postgres` is opt-in for the cutover rehearsal. Additive: it does not
// edit the foundation write contracts.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type { ExpertReviewInput } from '@/lib/programs/expert-kernel';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

/** A write outcome — `ok:false` carries a human-readable message. */
export interface ExpertReviewWriteOutcome {
  readonly ok: boolean;
  readonly id?: string;
  readonly error?: string;
}

function ok(id?: string): ExpertReviewWriteOutcome {
  return { ok: true, id };
}
function fail(error: string): ExpertReviewWriteOutcome {
  return { ok: false, error };
}

/** The full new-review payload — the kernel review plus its Move scope. */
export interface NewExpertReview extends ExpertReviewInput {
  readonly tenantClientKey: string;
  readonly moveRef: string;
  readonly moveName: string;
  readonly createdBy?: string | null;
}

/** The snake_case insert payload — shared shape for both planes. */
function toInsertColumns(input: NewExpertReview): Record<string, unknown> {
  return {
    tenant_client_key: canonicalTenantKey(input.tenantClientKey),
    move_ref: input.moveRef,
    move_name: input.moveName,
    reviewer_id: input.reviewerId,
    reviewer_role: input.role,
    verdict: input.verdict,
    note: input.note,
    assumption_keys: input.assumptionKeys ?? [],
    required_actions: input.requiredActions ?? [],
    created_by: input.createdBy ?? null,
  };
}

/** An expert-reviews write adapter for one physical data plane. */
export interface ExpertReviewsWriteAdapter {
  readonly name: DataPlane;
  /** Persist one append-only expert review. */
  recordReview(input: NewExpertReview): Promise<ExpertReviewWriteOutcome>;
}

/** Lightweight pre-insert validation — mirrors the kernel's view-model guard. */
function validate(input: NewExpertReview): string | null {
  if (!input.reviewerId.trim()) return 'A reviewer identity is required.';
  if (!input.note.trim()) return 'A written rationale is required.';
  if (!input.moveRef.trim()) return 'A Move ref is required.';
  return null;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

export function createSupabaseExpertReviewsWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): ExpertReviewsWriteAdapter {
  return {
    name: 'supabase',

    async recordReview(input) {
      const invalid = validate(input);
      if (invalid) return fail(invalid);
      const { data, error } = await getClient()
        .from('expert_reviews')
        .insert(toInsertColumns(input))
        .select('id')
        .single();
      if (error) return fail(error.message);
      return ok(String((data as { id?: unknown } | null)?.id ?? ''));
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? 'unknown');
}

export function createAzureExpertReviewsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-expert-reviews-write'),
): ExpertReviewsWriteAdapter {
  return {
    name: 'azure-postgres',

    async recordReview(input) {
      const invalid = validate(input);
      if (invalid) return fail(invalid);
      try {
        const columns = toInsertColumns(input);
        const keys = Object.keys(columns);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((k) => columns[k]);
        const rows = await session((sql) =>
          sql<{ id: string }>(
            `INSERT INTO expert_reviews (${keys.join(', ')})
             VALUES (${placeholders})
             RETURNING id`,
            values,
          ),
        );
        if (!rows[0]) return fail('review not returned after insert');
        return ok(rows[0].id);
      } catch (err) {
        return fail(errMessage(err));
      }
    },
  };
}

// --- selection -------------------------------------------------------------

export const supabaseExpertReviewsWriteAdapter: ExpertReviewsWriteAdapter =
  createSupabaseExpertReviewsWriteAdapter();
export const azureExpertReviewsWriteAdapter: ExpertReviewsWriteAdapter =
  createAzureExpertReviewsWriteAdapter();

/**
 * Select the expert-reviews write adapter for the configured data plane.
 * Defaults to Supabase — production write behavior is unchanged.
 */
export function selectExpertReviewsWriteAdapter(
  plane?: DataPlane,
): ExpertReviewsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureExpertReviewsWriteAdapter
    : supabaseExpertReviewsWriteAdapter;
}
