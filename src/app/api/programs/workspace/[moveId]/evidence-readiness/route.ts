// GET /api/programs/workspace/[moveId]/evidence-readiness
//
// Tenant-scoped evidence readiness for the Strategic Moves workspace. This is
// intentionally a thin API wrapper over the existing deterministic discovery
// readiness evaluator so the UI, gate checks, and upload response all speak the
// same readiness contract.

import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getProgramById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  try {
    const { moveId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, moveId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const readiness = await loadDiscoveryEvidenceReadiness(ctx, moveId);
    const needPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: program.name,
      currentPhase: program.currentPhase,
      readiness,
    });
    return Response.json({
      moveId,
      clientId: ctx.clientId,
      clientKey: ctx.clientKey,
      readiness,
      whatWeNeedNext: needPackets,
      groups: {
        minimumRequiredForDraft: readiness.families.filter(
          (family) => family.required,
        ),
        recommendedForExecutiveReview: readiness.families.filter(
          (family) => !family.required && family.status === "covered",
        ),
        optionalForBoardReady: readiness.families.filter(
          (family) => !family.required && family.status === "missing",
        ),
      },
      gapRegister: readiness.gapRegister,
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error("[workspace/evidence-readiness]", error);
      return Response.json(
        { error: "readiness_failed", detail: "Unable to load readiness." },
        { status: 500 },
      );
    }
  }
}
