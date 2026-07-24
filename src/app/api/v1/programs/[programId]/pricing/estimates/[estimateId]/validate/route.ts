// POST /api/v1/programs/:programId/pricing/estimates/:estimateId/validate
//
// Runs the "Run estimate" validation gate (brief §9.2 step 5) and returns
// whether the estimate is ready, plus every blocking reason if not — this
// is a read/check action (200 either way), not a mutation, so a blocked
// estimate is not an HTTP error.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { readEffortEnginePack } from "@/lib/pricing/effort-engine";
import { listEstimateInputs, listRequiredDriverCodesForArchetype, validateEstimateForRun } from "@/lib/pricing/moves-workflow";
import { requireOwnedEstimate, requireOwnedMove } from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; estimateId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, estimateId } = await params;

    const move = await requireOwnedMove(ctx, programId);
    if (!move) return Response.json({ error: "not_found" }, { status: 404 });

    const owned = await requireOwnedEstimate(ctx, programId, estimateId);
    if (!owned.ok) return Response.json({ error: owned.error, detail: owned.detail }, { status: owned.status });

    const pack = await readEffortEnginePack(owned.estimate.model_version);
    const requiredKeys = listRequiredDriverCodesForArchetype(pack, owned.estimate.archetype_code);

    const inputs = await listEstimateInputs(estimateId);
    const result = validateEstimateForRun(
      {
        currency: owned.estimate.currency,
        targetStartDate: owned.estimate.target_start_date,
        targetDurationWeeks: owned.estimate.target_duration_weeks,
        selectedRateCardId: owned.estimate.selected_rate_card_id,
      },
      requiredKeys,
      inputs.map((row) => ({
        inputKey: row.input_key,
        value: row.value,
        confirmedAt: row.confirmed_at,
        overrideReason: row.override_reason,
        confidence: row.confidence,
      })),
    );

    return Response.json({
      ok: true,
      estimateId,
      ready: result.ready,
      blockingReasons: result.blockingReasons,
      requiredInputKeys: result.requiredInputKeys,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/pricing/estimates/:estimateId/validate]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
