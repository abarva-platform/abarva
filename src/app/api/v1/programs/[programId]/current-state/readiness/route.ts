// GET /api/v1/programs/:programId/current-state/readiness?phase=N
// Infers the Move's estate profile and resolves current-state readiness (which
// instruments are required for this estate at this phase, committed vs missing),
// scoped to the active tenant. Read-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { getProgramById } from "@/lib/programs/queries";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();

    const phaseParam = req.nextUrl.searchParams.get("phase");
    const phase = Number(phaseParam ?? "1");
    if (!Number.isFinite(phase) || phase < 0 || phase > 5) {
      return Response.json({ error: "invalid_phase" }, { status: 400 });
    }

    // Archetype resolved from durable Move capture, not just the latest charter
    // blob. Later phase deliverables can replace `charter`; P0/P1 capture is
    // the durable business-context spine for readiness binding.
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    let archetype;
    try {
      archetype = await resolveMoveArchetypeForProgram(ctx, programId, program);
    } catch {
      archetype = await resolveMoveArchetypeForProgram(ctx, programId, null);
    }
    const profile = await inferMoveProfile(ctx);
    const report = await resolveCurrentStateReadiness(
      ctx,
      archetype,
      profile,
      phase,
      programId,
    );
    return Response.json(report);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
