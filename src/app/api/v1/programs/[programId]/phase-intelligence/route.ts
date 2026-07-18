// GET /api/v1/programs/:programId/phase-intelligence?phase=2
// Read-only Phase Intelligence synthesis for Moves. It composes existing
// governed state: KDDs, Function Pack signal, and gate/evidence truth.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { buildPhaseIntelligenceSummary } from "@/lib/programs/phase-intelligence-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(value: string | null): number {
  if (value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 ? parsed : 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const phase = parsePhase(req.nextUrl.searchParams.get("phase"));
    const summary = await buildPhaseIntelligenceSummary(ctx, { moveId: programId, phase });
    return Response.json(summary);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
