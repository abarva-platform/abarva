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
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";

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

    // Archetype resolved from the Move's own row (best-effort) — never a
    // hardcoded default for a Move we can read.
    let archetype = resolveProgramArchetype({});
    try {
      const move = await getStrategicMoveById(ctx, programId);
      if (move) {
        archetype = resolveProgramArchetype({
          archetype: move.archetype,
          classification: (move.charter as { classification?: string } | null)
            ?.classification,
          name: move.name,
        });
      }
    } catch {
      /* best-effort */
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
