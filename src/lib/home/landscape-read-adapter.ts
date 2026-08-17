import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";

/**
 * Home's own read path.
 *
 * Home had read-model tables all along — `public.home_knowledge_packs` and
 * `public.home_knowledge_dimensions` — but no code that read them. The page imported Source's
 * adapter and rendered contract and vendor counts instead, and Intelligence rendered Home's
 * view model in turn. Three products deep, none of them reading the canonical model, which is
 * why the enterprise landscape never reflected a refresh.
 *
 * This reads the landscape Home owns, from the pack the canonical projector wrote. Everything
 * here is per-tenant and per-build: a row that cannot be traced to a build is not shown, because
 * an unattributable number on an executive surface is worse than an empty panel.
 */

export interface HomeLandscapeDimension {
  readonly dimensionKey: string;
  readonly displayName: string;
  readonly recordCount: number;
  readonly evidenceCount: number;
  /** `evidenced` · `directional` · `not_available` — never silently a confident zero. */
  readonly confidenceStatus: string;
  /** Canonical object type this dimension projects, carried so a reader can trace a count back. */
  readonly objectType: string | null;
  /** Intelligence advisory section this dimension answers, or null when no section asks it. */
  readonly section: string | null;
  /** Distinct named instances, which is usually lower than `recordCount`. */
  readonly distinctNameCount: number;
  /** Named examples, so a count reads as a landscape rather than an inventory total. */
  readonly sampleEntities: readonly string[];
}

export interface HomeLandscape {
  readonly buildVersion: string;
  readonly generatedAt: string | null;
  readonly dimensions: readonly HomeLandscapeDimension[];
  readonly totalEntities: number;
  /** Dimensions the client has not supplied. Shown as gaps, not hidden. */
  readonly gaps: readonly string[];
}

/**
 * Load the most recent landscape pack for a tenant.
 *
 * Returns null rather than throwing when the projector has not run: a Home page that renders
 * without its landscape is a degraded surface, but a Home page that renders a stale one is a
 * wrong answer, and the second is worse.
 */
export async function loadHomeLandscape(
  tenantKey: string | null | undefined,
): Promise<HomeLandscape | null> {
  if (!tenantKey) return null;
  try {
    const rows = await azureRead.query<{
      pack_version: string;
      created_at: string | null;
      dimension_key: string;
      display_name: string;
      record_count: number;
      evidence_count: number;
      confidence_status: string;
      metadata: Record<string, unknown> | null;
    }>(
      `select p.pack_version,
              p.created_at,
              d.dimension_key,
              d.display_name,
              d.record_count,
              d.evidence_count,
              d.confidence_status,
              d.metadata
         from public.home_knowledge_dimensions d
         join public.home_knowledge_packs p on p.id = d.pack_id
        where d.tenant_key = $1
          and p.artifact_type = 'NexusHomeLandscapeV1'
          and p.id = (
            select id from public.home_knowledge_packs
             where tenant_key = $1 and artifact_type = 'NexusHomeLandscapeV1'
             order by created_at desc
             limit 1
          )
        order by d.sort_order`,
      [tenantKey],
      { missingTable: "empty" },
    );
    if (rows.length === 0) return null;

    const dimensions = rows.map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const samples = Array.isArray(meta.sampleEntities) ? meta.sampleEntities : [];
      return {
        dimensionKey: r.dimension_key,
        displayName: r.display_name,
        recordCount: Number(r.record_count ?? 0),
        evidenceCount: Number(r.evidence_count ?? 0),
        confidenceStatus: r.confidence_status,
        objectType: typeof meta.objectType === "string" ? meta.objectType : null,
        section: typeof meta.section === "string" ? meta.section : null,
        distinctNameCount: Number(meta.distinctNameCount ?? 0),
        sampleEntities: samples.filter((v): v is string => typeof v === "string"),
      };
    });

    return {
      buildVersion: rows[0].pack_version,
      generatedAt: rows[0].created_at,
      dimensions,
      totalEntities: dimensions.reduce((n, d) => n + d.recordCount, 0),
      gaps: dimensions.filter((d) => d.recordCount === 0).map((d) => d.displayName),
    };
  } catch {
    return null;
  }
}
