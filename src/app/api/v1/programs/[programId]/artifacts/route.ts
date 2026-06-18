// GET /api/v1/programs/:programId/artifacts?family=&currentOnly=1
// Move File Cabinet data: durable artifacts registered in move_artifacts (Blob +
// Postgres), newest first, filterable by family / current-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import {
  listMoveArtifacts,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CabinetArtifact {
  artifactId: string;
  artifactType: string;
  family: string;
  title: string;
  phase: number | null;
  fileFormat: string | null;
  fileName: string | null;
  version: number;
  status: string;
  lifecycleState?: string | null;
  qualityScore: number | null;
  unsupportedClaims?: number | null;
  generatedBy: string | null;
  createdAt: string;
  fileSize?: number | null;
  stored?: string | null;
  openItems?: string[];
  downloadUrl: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const family = req.nextUrl.searchParams.get(
      "family",
    ) as ArtifactFamily | null;
    const currentOnly = req.nextUrl.searchParams.get("currentOnly") === "1";
    const rows = await listMoveArtifacts(ctx, programId, {
      family: family ?? undefined,
      currentOnly,
    });

    const moveArtifacts: CabinetArtifact[] = rows.map((r) => ({
      artifactId: r.artifact_id,
      artifactType: r.artifact_type,
      family: r.artifact_family,
      title: r.title,
      phase: r.phase,
      fileFormat: r.file_format,
      fileName: r.file_name,
      version: r.version,
      status: r.status,
      lifecycleState: r.lifecycle_state,
      qualityScore: r.quality_score,
      unsupportedClaims: r.unsupported_claims_count,
      generatedBy: r.generated_by,
      createdAt: r.created_at,
      fileSize: r.file_size,
      stored: (r.metadata as { storage?: string })?.storage ?? null,
      openItems: (r.metadata as { openItems?: string[] })?.openItems ?? [],
      downloadUrl: `/api/v1/programs/${programId}/artifacts/${r.artifact_id}/download`,
    }));

    // Also surface the governed generated_artifacts (the real output of Approve &
    // Build / the orchestrator) — the durable move_artifacts vault often does not
    // mirror them, so the Cabinet would otherwise look near-empty. These are the
    // "generated_deliverable" family; only included when that family is selected
    // (or no family filter is applied). De-duped against move_artifacts by id.
    let generated: CabinetArtifact[] = [];
    if (!family || family === "generated_deliverable") {
      try {
        const recs = await listGeneratedArtifactsForMoveAllRefs({
          clientId: ctx.clientId,
          moveId: programId,
        });
        const seen = new Set(moveArtifacts.map((a) => a.artifactId));
        generated = recs
          .filter((rec) => !seen.has(rec.id))
          .map((rec) => {
            const meta = rec.metadata as {
              renderableDoc?: { title?: string };
            } | null;
            return {
              artifactId: rec.id,
              artifactType: rec.artifactType,
              family: "generated_deliverable",
              title: meta?.renderableDoc?.title ?? rec.artifactType,
              phase: null,
              fileFormat: rec.outputFormat,
              fileName: null,
              version: 1,
              status: rec.quarantineReason ? "quarantined" : "board_ready",
              qualityScore: rec.qualityScore,
              generatedBy: rec.renderedBy,
              createdAt: rec.renderedAt,
              downloadUrl: `/api/v1/artifacts/${rec.id}`,
            };
          });
      } catch (err) {
        // Non-fatal: the Cabinet still renders the move_artifacts vault if the
        // generated_artifacts read fails (e.g. transient DB issue).
        console.error(
          "[GET /programs/:id/artifacts] generated_artifacts merge failed",
          err,
        );
      }
    }

    const artifacts = [...generated, ...moveArtifacts].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    return Response.json({ ok: true, count: artifacts.length, artifacts });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
