// GET /api/v1/programs/:programId/artifacts?family=&currentOnly=1
// Move File Cabinet data: durable artifacts registered in move_artifacts (Blob +
// Postgres), newest first, filterable by family / current-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import {
  listMoveArtifacts,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return Response.json({
      ok: true,
      count: rows.length,
      artifacts: rows.map((r) => ({
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
      })),
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
