// POST /api/v1/programs/:programId/pricing/estimates/:estimateId/run
//
// Execute the estimate (brief §9.4): calls PR4's real effort engine,
// persists the resulting line items (replace-on-rerun), and returns the
// results shape the results view renders. Blocked (409) if the validation
// gate is not satisfied — the SAME gate `/validate` reports, so a client
// that just called `/validate` and saw `ready: true` will never be
// surprised here.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { EstimateNotFoundError, EstimateNotReadyError, EstimateTenantMismatchError, runEstimate } from "@/lib/pricing/moves-workflow";
import { requireOwnedEstimate, requireOwnedMove, tenantKeyFor } from "../../../_shared";

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

    try {
      const result = await runEstimate({ estimateId, tenantKey: tenantKeyFor(ctx) });
      return Response.json({ ok: true, result });
    } catch (err) {
      if (err instanceof EstimateNotReadyError) {
        return Response.json(
          { error: "estimate_not_ready", detail: err.message, blockingReasons: err.blockingReasons },
          { status: 409 },
        );
      }
      if (err instanceof EstimateNotFoundError || err instanceof EstimateTenantMismatchError) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
      throw err;
    }
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/pricing/estimates/:estimateId/run]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
