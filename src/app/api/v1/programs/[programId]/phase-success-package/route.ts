import { NextRequest } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { generatePhaseSuccessPackages } from "@/lib/programs/phase-success-package/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (!accessPolicy.canGenerateDeliverables) {
      return Response.json(
        { error: "forbidden_generate_deliverables" },
        { status: 403 },
      );
    }
    const move = await getStrategicMoveById(ctx, programId);
    if (!move) {
      return Response.json({ error: "move_not_found" }, { status: 404 });
    }

    const requestedPhase = req.nextUrl.searchParams.get("phase");
    const phase =
      requestedPhase === null || requestedPhase === ""
        ? move.currentPhase
        : Number(requestedPhase);
    const result = await generatePhaseSuccessPackages(ctx, { move, phase });

    return Response.json({
      ok: true,
      phase: result.phase,
      packageCount: result.packages.length,
      packages: result.packages.map((pkg) => ({
        kind: pkg.kind,
        artifactId: pkg.artifactId,
        artifactType: pkg.artifactType,
        title: pkg.title,
        version: pkg.version,
        blobStored: pkg.blobStored,
        reusedExisting: pkg.reusedExisting,
        status: pkg.status,
        downloadUrl: pkg.downloadUrl,
      })),
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
