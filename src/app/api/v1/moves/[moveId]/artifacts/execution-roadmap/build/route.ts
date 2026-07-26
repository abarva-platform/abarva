// POST /api/v1/moves/:moveId/artifacts/execution-roadmap/build
//
// PR12 — run the DEDICATED governed roadmap structured pass + build + persist for
// a Move, then return the outcome. This is the fast path that fixes the defect:
// it does NOT regenerate the multi-minute HTML narrative — it runs one focused
// structured-output call, builds the governed contract, and persists either a
// valid governed record (so the current/download route resolves it) or a
// governed FAILURE record (so the failure is observable). Nothing is swallowed.

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { runGovernedRoadmapBuild } from "@/lib/deliverables/run-governed-roadmap-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (e) {
    return tenancyErrorResponse(e);
  }

  const { moveId } = await params;

  if (
    !isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_governed_roadmap_downloads",
    )
  ) {
    // Non-enumerating: behave as if the surface doesn't exist when off.
    return Response.json({ error: "roadmap_not_found" }, { status: 404 });
  }

  try {
    const result = await runGovernedRoadmapBuild(ctx, { moveId });
    // 200 with the outcome — success OR a governed failure the UI can show.
    return Response.json(
      {
        ok: result.status === "success",
        status: result.status,
        runId: result.runId,
        attemptedAt: result.attemptedAt,
        version: result.version,
        contentHash: result.contentHash,
        failureDetail: result.failureDetail,
        attempts: result.attempts,
      },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      { error: "roadmap_build_failed", detail: (e as Error).message },
      { status: 500 },
    );
  }
}
