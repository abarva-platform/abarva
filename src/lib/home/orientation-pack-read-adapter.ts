import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";

/**
 * Home's orientation pack, read back.
 *
 * The pack is generated ahead of time and stored — not composed at request time. That choice is what
 * makes this adapter small: there is no aggregation here, no model call, no fallback composition. It
 * fetches the row a build already wrote and already validated.
 *
 * The filtering is the whole substance of this file. `home_knowledge_packs` carries `status` and
 * `validation_status` because generated content needs a gate between "produced" and "shown", and a
 * reader that ignores those columns turns the gate into decoration. So:
 *
 *   - a pack whose validation failed is never served, at any status
 *   - a `retired` pack is never served, because superseding is how a build replaces content
 *   - `approved` is preferred over `candidate` when both are current, so a reviewed pack wins
 *
 * Narrative is nullable throughout, and callers must render the facts without it. A block whose prose
 * was rejected still has everything a reader needs; the sentence was the decoration, not the content.
 */

export interface OrientationFact {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
}

export interface OrientationBlock {
  readonly id: string;
  readonly heading: string;
  readonly question: string;
  readonly facts: readonly OrientationFact[];
  readonly narrative: string | null;
}

export interface OrientationDimension {
  readonly key: string;
  readonly objectType: string;
  readonly label: string;
  readonly recordCount: number;
  readonly distinctNameCount: number;
  readonly evidencedCount: number;
  readonly sampleEntities: readonly string[];
  readonly categories: ReadonlyArray<{
    attribute: string;
    distinctValues: number;
    top: ReadonlyArray<{ value: string; count: number; share: number }>;
    tailCount: number;
    topShare: number;
  }>;
  readonly numerics: ReadonlyArray<{
    attribute: string;
    populated: number;
    sum: number;
    min: number;
    median: number;
    max: number;
    topTenShare: number;
  }>;
  readonly sparseAttributes: ReadonlyArray<{ attribute: string; populatedShare: number }>;
  readonly notable: ReadonlyArray<{ name: string; attribute: string; value: number }>;
  readonly insight: string | null;
}

export interface OrientationPack {
  readonly tenantKey: string;
  readonly buildVersion: string;
  readonly generatedAt: string;
  readonly blocks: readonly OrientationBlock[];
  readonly dimensions: readonly OrientationDimension[];
  /** Where this content came from and whether a human has signed it off. Rendered, not hidden. */
  readonly provenance: {
    readonly packVersion: string;
    readonly status: string;
    readonly validationStatus: string;
    readonly claudeModel: string | null;
    readonly promptVersion: string | null;
    readonly qualityScore: number | null;
    readonly approvedBy: string | null;
    readonly approvedAt: string | null;
    readonly narrativesGenerated: number;
    readonly narrativesRejected: number;
  };
}

export async function loadOrientationPack(
  tenantKey: string | null | undefined,
): Promise<OrientationPack | null> {
  if (!tenantKey) return null;
  try {
    const rows = await azureRead.query<{
      pack_version: string;
      status: string;
      validation_status: string;
      claude_model: string | null;
      claude_prompt_version: string | null;
      quality_score: string | number | null;
      approved_by: string | null;
      approved_at: string | null;
      render_pack: Record<string, unknown> | null;
    }>(
      `select pack_version, status, validation_status, claude_model,
              claude_prompt_version, quality_score, approved_by, approved_at, render_pack
         from public.home_knowledge_packs
        where tenant_key = $1
          and artifact_type = 'NexusHomeOrientationPackV1'
          and status <> 'retired'
          and validation_status <> 'fail'
        order by case when status = 'approved' then 0 else 1 end,
                 created_at desc
        limit 1`,
      [tenantKey],
      { missingTable: "empty" },
    );

    const row = rows[0];
    const pack = row?.render_pack as
      | {
          buildVersion?: string;
          generatedAt?: string;
          blocks?: OrientationBlock[];
          dimensions?: OrientationDimension[];
          coverage?: { narrativesGenerated?: number; narrativesRejected?: number };
        }
      | null
      | undefined;
    // An empty render_pack is a build that ran and produced nothing. Returning a shell of headings
    // with no facts under them would read as "this client has no data", which is a different and
    // much worse claim than "not built yet".
    if (!row || !pack?.blocks?.length) return null;

    return {
      tenantKey,
      buildVersion: pack.buildVersion ?? "unknown",
      generatedAt: pack.generatedAt ?? "",
      blocks: pack.blocks,
      dimensions: pack.dimensions ?? [],
      provenance: {
        packVersion: row.pack_version,
        status: row.status,
        validationStatus: row.validation_status,
        claudeModel: row.claude_model,
        promptVersion: row.claude_prompt_version,
        qualityScore: row.quality_score === null ? null : Number(row.quality_score),
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        narrativesGenerated: pack.coverage?.narrativesGenerated ?? 0,
        narrativesRejected: pack.coverage?.narrativesRejected ?? 0,
      },
    };
  } catch {
    return null;
  }
}
