// Expert-reviews read adapter.
//
// Reads persisted `expert_reviews` rows (migration
// 20260519120000_expert_reviews.sql) for one Move and maps the snake_case
// columns onto the kernel's `ExpertReviewInput` shape — exactly what the
// calibration engine and the Expert Review Console consume.
//
// Routed through the data-plane read-adapter seam so the Azure cutover
// (`ABARVA_DATA_PLANE=azure-postgres`) needs no route rewrite. Additive: it
// does not edit the foundation read contracts.
//
// Reads are tenant + Move scoped, oldest first (the calibration engine is
// order-independent, but a stable order keeps the console deterministic). The
// adapter is fail-soft: a missing table (the migration is authored-not-applied
// until the founder runs db:migrate) degrades to an empty list rather than
// throwing, so the console keeps rendering the kernel case with zero reviews.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  ExpertReviewInput,
  ExpertReviewerRole,
  ExpertReviewVerdict,
} from '@/lib/programs/expert-kernel';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** The columns the adapter reads, shared by both planes. */
const EXPERT_REVIEW_COLUMNS = [
  'id',
  'tenant_client_key',
  'move_ref',
  'move_name',
  'reviewer_id',
  'reviewer_role',
  'verdict',
  'note',
  'assumption_keys',
  'required_actions',
  'created_by',
  'created_at',
] as const;

/** A raw `expert_reviews` row, snake_case as stored. */
interface ExpertReviewRow {
  id: string;
  tenant_client_key: string;
  move_ref: string;
  move_name: string;
  reviewer_id: string;
  reviewer_role: string;
  verdict: string;
  note: string;
  assumption_keys: string[] | null;
  required_actions: string[] | null;
  created_by: string | null;
  created_at: string;
}

const ROLES: readonly ExpertReviewerRole[] = [
  'cfo',
  'transformation_partner',
  'sourcing_vp',
  'delivery_lead',
  'domain_operator',
  'risk_compliance',
];
const VERDICTS: readonly ExpertReviewVerdict[] = [
  'credible',
  'credible_with_conditions',
  'weak',
  'wrong',
];

function asRole(value: string): ExpertReviewerRole {
  return ROLES.includes(value as ExpertReviewerRole)
    ? (value as ExpertReviewerRole)
    : 'domain_operator';
}
function asVerdict(value: string): ExpertReviewVerdict {
  return VERDICTS.includes(value as ExpertReviewVerdict)
    ? (value as ExpertReviewVerdict)
    : 'weak';
}

/** Map one persisted row onto the kernel's `ExpertReviewInput` shape. */
function mapRow(row: ExpertReviewRow): ExpertReviewInput {
  return {
    reviewerId: row.reviewer_id,
    role: asRole(row.reviewer_role),
    verdict: asVerdict(row.verdict),
    note: row.note ?? '',
    assumptionKeys: row.assumption_keys ?? [],
    requiredActions: row.required_actions ?? [],
  };
}

/** True when the error is the migration-not-applied / missing-table case. */
function isMissingTable(message: string): boolean {
  return /expert_reviews|schema cache|does not exist|relation .* does not exist/i.test(
    message,
  );
}

/** An expert-reviews read adapter for one physical data plane. */
export interface ExpertReviewsReadAdapter {
  readonly name: DataPlane;
  /** All expert reviews for one Move, oldest first. Fail-soft to []. */
  listForMove(tenantKey: string, moveRef: string): Promise<ExpertReviewInput[]>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

export function createSupabaseExpertReviewsReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): ExpertReviewsReadAdapter {
  return {
    name: 'supabase',

    async listForMove(tenantKey, moveRef) {
      const key = canonicalTenantKey(tenantKey);
      try {
        const result = await getClient()
          .from('expert_reviews')
          .select(EXPERT_REVIEW_COLUMNS.join(','))
          .eq('tenant_client_key', key)
          .eq('move_ref', moveRef)
          .order('created_at', { ascending: true });
        if (result.error) {
          if (isMissingTable(result.error.message)) return [];
          throw new Error(result.error.message);
        }
        return ((result.data as unknown as ExpertReviewRow[] | null) ?? []).map(
          mapRow,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isMissingTable(message)) return [];
        throw err;
      }
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

export function createAzureExpertReviewsReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-expert-reviews-read'),
): ExpertReviewsReadAdapter {
  return {
    name: 'azure-postgres',

    async listForMove(tenantKey, moveRef) {
      try {
        const rows = await session((sql) =>
          sql<ExpertReviewRow>(
            `SELECT ${EXPERT_REVIEW_COLUMNS.join(', ')}
               FROM expert_reviews
              WHERE tenant_client_key = $1 AND move_ref = $2
              ORDER BY created_at ASC`,
            [canonicalTenantKey(tenantKey), moveRef],
          ),
        );
        return rows.map(mapRow);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isMissingTable(message)) return [];
        throw err;
      }
    },
  };
}

// --- selection -------------------------------------------------------------

export const supabaseExpertReviewsReadAdapter: ExpertReviewsReadAdapter =
  createSupabaseExpertReviewsReadAdapter();
export const azureExpertReviewsReadAdapter: ExpertReviewsReadAdapter =
  createAzureExpertReviewsReadAdapter();

/**
 * Select the expert-reviews read adapter for the configured data plane.
 * Defaults to Supabase — production read behavior is unchanged.
 */
export function selectExpertReviewsReadAdapter(
  plane?: DataPlane,
): ExpertReviewsReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureExpertReviewsReadAdapter
    : supabaseExpertReviewsReadAdapter;
}
