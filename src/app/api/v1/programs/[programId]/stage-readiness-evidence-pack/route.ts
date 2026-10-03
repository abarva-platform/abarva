import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getProgramById } from "@/lib/programs/queries";
import { buildStageReadinessWorkbookSpec } from "@/lib/programs/stage-readiness-workbooks/resolver";
import { renderSyntheticStageReadinessEvidencePackZip } from "@/lib/programs/stage-readiness-workbooks/synthetic-evidence-pack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(
  value: string | null | undefined,
  fallback: number,
): number | null {
  const raw =
    value === null || value === undefined || value === ""
      ? fallback
      : Number(value);
  if (!Number.isInteger(raw) || raw < 0 || raw > 4) return null;
  return raw;
}

function safeFilenamePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "move";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    if (!isFoundationTenantKey(ctx.clientKey)) {
      return Response.json(
        {
          error: "not_available",
          detail:
            "Synthetic sample evidence packs are limited to foundation/demo tenants. Use the workbook to collect reviewed evidence for this tenant.",
        },
        { status: 403 },
      );
    }

    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const url = new URL(req.url);
    const phase = parsePhase(
      url.searchParams.get("phase"),
      program.currentPhase ?? 1,
    );
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,4]" },
        { status: 400 },
      );
    }

    const nextPhase = phase + 1;
    const readiness = await loadDiscoveryEvidenceReadiness(ctx, programId);
    const evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId: programId,
      moveName: program.name ?? "Move",
      currentPhase: phase,
      readiness,
    });
    const spec = buildStageReadinessWorkbookSpec({
      moveId: programId,
      moveName: program.name ?? "Move",
      phase,
      nextPhase,
      archetype: readiness.archetypeLabel,
      readiness,
      evidenceNeedPackets,
      generatedAt: new Date().toISOString(),
    });
    const pack = await renderSyntheticStageReadinessEvidencePackZip(spec);
    const filename = `${safeFilenamePart(program.name ?? programId)}-p${phase}-p${nextPhase}-synthetic-evidence-pack.zip`;

    return new Response(new Uint8Array(pack), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, max-age=0, no-store",
        "x-abarva-workbook-id": spec.workbookId,
        "x-abarva-evidence-pack": "synthetic-demo",
      },
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error(
        "[GET /api/v1/programs/:programId/stage-readiness-evidence-pack]",
        error,
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }
}
