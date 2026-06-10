// GET /api/v1/programs/:programId/current-state/plan?moveName=...
// Builds the sequenced plan (work packages → roadmap → estimate-phased-by-roadmap)
// from the current-state recommendation. Read-only; tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { inferMoveProfile } from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    await params;
    const ctx = await requireTenancy();
    const moveName = req.nextUrl.searchParams.get("moveName") ?? "Move";
    const profile = await inferMoveProfile(ctx);
    const recommendation = await buildCurrentStateRecommendation(ctx, profile);
    const plan = buildCurrentStatePlan(recommendation, { moveName });
    return Response.json(plan);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
