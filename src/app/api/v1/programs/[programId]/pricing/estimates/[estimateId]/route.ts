// GET /api/v1/programs/:programId/pricing/estimates/:estimateId
//
// Current draft state: header + inputs + (if a run has ever completed) the
// persisted line items from the most recent run.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { listEstimateInputs, listLineItems } from "@/lib/pricing/moves-workflow";
import { estimateToJson, inputToJson, requireOwnedEstimate, requireOwnedMove } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

    const [inputs, lineItems] = await Promise.all([
      listEstimateInputs(estimateId),
      listLineItems(estimateId),
    ]);

    return Response.json({
      ok: true,
      estimate: estimateToJson(owned.estimate),
      inputs: inputs.map(inputToJson),
      lineItemCount: lineItems.length,
      hasRun: owned.estimate.last_run_id !== null,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/programs/:programId/pricing/estimates/:estimateId]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
