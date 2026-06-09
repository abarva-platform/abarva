// GET /api/v1/programs/:programId/current-state/recommendation
// Infers the Move's estate profile and reasons over committed current-state
// evidence to produce the maturity profile, capability gaps (two-gap), the
// AI-leverage×readiness ranking, and the where-to-start recommendation.
// Read-only; tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { inferMoveProfile } from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    await params;
    const ctx = await requireTenancy();
    const profile = await inferMoveProfile(ctx);
    const recommendation = await buildCurrentStateRecommendation(ctx, profile);
    return Response.json(recommendation);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
