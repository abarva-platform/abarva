// Deliverable promotion write adapter (Slice 3b).
//
// Backs the DB-write half of `POST /api/v1/artifacts/:artifactId/promote`,
// which promotes an ephemeral `intelligence_artifact` into a first-class
// `deliverables_v2` row. The route keeps its auth, the artifact read
// (`getArtifact`) and the governance flip (`promoteArtifact`); this adapter
// owns ONLY the three coupled writes:
//   1. upsert  deliverable_types   (ensure the artifact-kind type row exists)
//   2. insert  deliverables_v2     (the new deliverable, RETURNING id)
//   3. insert  deliverable_versions(the artifact content as v1)
//
// On Azure these three run inside a single `BEGIN`/`COMMIT` transaction so a
// half-promoted deliverable can never be left behind; the Supabase JS client
// has no client-side transaction, so its statements apply individually — the
// pre-seam behavior, unchanged. Supabase stays the default; `azure-postgres`
// is opt-in via `ABARVA_DATA_PLANE` (design doc §2, cutover-flip).
//
// `promoteArtifact` is intentionally NOT migrated here: it lives in
// `src/lib/intelligence/db/artifactRepository.ts` and is also exercised by
// that repository's own callers. Migrating it is a follow-up so a
// shared-helper change does not collide with parallel slices.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

/** Inputs for promoting an artifact into a deliverable. */
export interface DeliverablePromotionWrite {
  /** `deliverable_types.type_key` for the artifact kind, e.g. `artifact_brief`. */
  readonly typeKey: string;
  /** The artifact kind, used for the type-row title. */
  readonly artifactKind: string;
  /** Target program / engagement id. */
  readonly engagementId: string;
  /** Artifact title — becomes the deliverable title. */
  readonly title: string;
  /** Artifact HTML body — becomes deliverable version 1 content. */
  readonly htmlContent: string;
  /** Source artifact id, recorded in the version's structured_data. */
  readonly artifactId: string;
  /** Optional attachment metadata, recorded in structured_data. */
  readonly attachmentMetadata: Record<string, unknown>;
  /** Actor — `deliverables_v2.created_by`. */
  readonly createdByUserId: string;
}

/** Outcome of a deliverable-promotion write. */
export interface DeliverableWriteOutcome {
  readonly ok: boolean;
  /** The new `deliverables_v2.id` on success. */
  readonly deliverableId?: string;
  readonly error?: string;
}

/** A deliverable-promotion write adapter for one physical data plane. */
export interface DeliverableWriteAdapter {
  readonly name: DataPlane;
  /** Run the type-upsert + deliverable-insert + version-insert as one unit. */
  promoteToDeliverable(
    input: DeliverablePromotionWrite,
  ): Promise<DeliverableWriteOutcome>;
}

/** The `deliverable_types` upsert body — verbatim from the pre-seam route. */
function typeRow(input: DeliverablePromotionWrite): Record<string, unknown> {
  return {
    type_key: input.typeKey,
    title: `${input.artifactKind} (from Intelligence)`,
    description: 'Artifact promoted from Intelligence thread',
    applicable_phases: [],
    applicable_topics: [],
    template_structure: {},
    required_data_inputs: {},
    quality_rubric: {},
    generation_prompt_template: '',
    output_format: 'markdown',
    maturity: 'production',
  };
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase deliverable write adapter. Each statement is the verbatim
 * pre-seam call so the produced rows are byte-faithful.
 */
export function createSupabaseDeliverableWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): DeliverableWriteAdapter {
  return {
    name: 'supabase',
    async promoteToDeliverable(input) {
      const sb = getClient();
      try {
        const { error: typeError } = await sb
          .from('deliverable_types')
          .upsert(typeRow(input), { onConflict: 'type_key' });
        if (typeError) return { ok: false, error: typeError.message };

        const { data: deliverable, error: dErr } = await sb
          .from('deliverables_v2')
          .insert({
            engagement_id: input.engagementId,
            deliverable_type_key: input.typeKey,
            title: input.title,
            status: 'draft',
            current_version: 1,
            created_by: input.createdByUserId,
          })
          .select('id')
          .single();
        if (dErr) return { ok: false, error: dErr.message };

        const deliverableId = (deliverable as { id: string }).id;
        const { error: versionError } = await sb
          .from('deliverable_versions')
          .insert({
            deliverable_id: deliverableId,
            version: 1,
            content: input.htmlContent,
            structured_data: {
              promoted_from_artifact_id: input.artifactId,
              attachment_metadata: input.attachmentMetadata,
            },
          });
        if (versionError) return { ok: false, error: versionError.message };

        return { ok: true, deliverableId };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'promotion write failed' };
      }
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres deliverable write adapter. The three statements run
 * inside one `BEGIN`/`COMMIT` so the promotion is atomic. The transaction
 * session is injectable so tests drive it without a live Azure Postgres.
 */
export function createAzureDeliverableWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-deliverable-write'),
): DeliverableWriteAdapter {
  return {
    name: 'azure-postgres',
    async promoteToDeliverable(input) {
      try {
        const deliverableId = await session(async (run) => {
          await run(
            `INSERT INTO deliverable_types
               (type_key, title, description, applicable_phases, applicable_topics,
                template_structure, required_data_inputs, quality_rubric,
                generation_prompt_template, output_format, maturity)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT (type_key) DO UPDATE SET title = EXCLUDED.title`,
            [
              input.typeKey,
              `${input.artifactKind} (from Intelligence)`,
              'Artifact promoted from Intelligence thread',
              JSON.stringify([]),
              JSON.stringify([]),
              JSON.stringify({}),
              JSON.stringify({}),
              JSON.stringify({}),
              '',
              'markdown',
              'production',
            ],
          );
          const inserted = await run<{ id: string }>(
            `INSERT INTO deliverables_v2
               (engagement_id, deliverable_type_key, title, status, current_version, created_by)
             VALUES ($1,$2,$3,'draft',1,$4)
             RETURNING id`,
            [input.engagementId, input.typeKey, input.title, input.createdByUserId],
          );
          const id = inserted[0]?.id;
          if (!id) throw new Error('deliverables_v2 insert returned no id');
          await run(
            `INSERT INTO deliverable_versions
               (deliverable_id, version, content, structured_data)
             VALUES ($1,1,$2,$3)`,
            [
              id,
              input.htmlContent,
              JSON.stringify({
                promoted_from_artifact_id: input.artifactId,
                attachment_metadata: input.attachmentMetadata,
              }),
            ],
          );
          return id;
        });
        return { ok: true, deliverableId };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'promotion write failed' };
      }
    },
  };
}

// --- selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseDeliverableWriteAdapter: DeliverableWriteAdapter =
  createSupabaseDeliverableWriteAdapter();
export const azureDeliverableWriteAdapter: DeliverableWriteAdapter =
  createAzureDeliverableWriteAdapter();

/**
 * Select the deliverable write adapter for the configured data plane.
 * Defaults to Supabase — production write behavior is unchanged.
 */
export function selectDeliverableWriteAdapter(
  plane?: DataPlane,
): DeliverableWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureDeliverableWriteAdapter
    : supabaseDeliverableWriteAdapter;
}
