// POST /api/v1/programs/:programId/pricing/estimates
//
// Create a Cost & Effort estimate draft (brief §9.2 step 1 / §10). Move-
// scoped: requires the requesting user to have tenant-scoped access to
// `programId` (via `getProgramById`), matching every other
// `programs/:programId/**` route's convention — NOT the admin-only
// `requireTenancy()`-alone pattern used by `api/admin/pricing/rate-cards/`.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { getCurrentModelVersion } from "@/lib/pricing/effort-engine";
import { createDraftEstimate } from "@/lib/pricing/moves-workflow";
import { estimateToJson, requireOwnedMove, tenantKeyFor } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateEstimateBody {
  scenarioName?: unknown;
  scenarioKey?: unknown;
  archetypeCode?: unknown;
  currency?: unknown;
  targetStartDate?: unknown;
  targetDurationWeeks?: unknown;
  selectedRateCardId?: unknown;
  scenarioGroupId?: unknown;
}

function badRequest(detail: string) {
  return Response.json({ error: "bad_request", detail }, { status: 400 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;

    const move = await requireOwnedMove(ctx, programId);
    if (!move) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as CreateEstimateBody;

    if (typeof body.scenarioName !== "string" || body.scenarioName.trim().length === 0) {
      return badRequest("scenarioName is required");
    }
    if (typeof body.archetypeCode !== "string" || body.archetypeCode.trim().length === 0) {
      return badRequest("archetypeCode is required");
    }

    const modelVersionRow = await getCurrentModelVersion();
    if (!modelVersionRow) {
      return Response.json(
        { error: "pricing_model_not_loaded", detail: "No current pricing_model_versions row — run the PR4 reference-pack loader first." },
        { status: 503 },
      );
    }

    const estimate = await createDraftEstimate({
      tenantKey: tenantKeyFor(ctx),
      moveId: programId,
      scenarioName: body.scenarioName,
      scenarioKey: typeof body.scenarioKey === "string" ? body.scenarioKey : undefined,
      archetypeCode: body.archetypeCode,
      modelVersion: modelVersionRow.version,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      targetStartDate: typeof body.targetStartDate === "string" ? body.targetStartDate : null,
      targetDurationWeeks: typeof body.targetDurationWeeks === "number" ? body.targetDurationWeeks : null,
      selectedRateCardId: typeof body.selectedRateCardId === "string" ? body.selectedRateCardId : null,
      scenarioGroupId: typeof body.scenarioGroupId === "string" ? body.scenarioGroupId : null,
      createdBy: ctx.userId ?? null,
    });

    return Response.json({ ok: true, estimate: estimateToJson(estimate) }, { status: 201 });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/pricing/estimates]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
