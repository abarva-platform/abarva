// GET /api/programs/workspace/[moveId]/charter-preflight
//
// Read-only Charter preflight: reports, per required Charter section, whether
// P0's structured capture actually grounds it — before Claude is ever called.
// Advisory today, not a hard generation block (see charter-preflight.ts's own
// header comment and the release record for 2026-07-25 for why a hard block
// needs a UI surface that doesn't exist yet). Same thin-wrapper-over-a-
// deterministic-evaluator pattern as evidence-readiness/route.ts.

import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { computeCharterPreflightForMove } from "@/lib/programs/charter-preflight";
import { getProgramById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  try {
    const { moveId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, moveId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const preflight = await computeCharterPreflightForMove(ctx, moveId);
    return Response.json({
      moveId,
      clientId: ctx.clientId,
      clientKey: ctx.clientKey,
      preflight,
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error("[workspace/charter-preflight]", error);
      return Response.json(
        { error: "preflight_failed", detail: "Unable to compute Charter preflight." },
        { status: 500 },
      );
    }
  }
}
