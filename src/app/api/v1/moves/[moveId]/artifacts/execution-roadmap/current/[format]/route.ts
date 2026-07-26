// GET /api/v1/moves/:moveId/artifacts/execution-roadmap/current/:format
//
// PR11 — the client-addressable governed roadmap download. A caller asks by
// Move + type + "current" + format (pptx | docx | html; contract | provenance are
// restricted). The newest VALID governed contract is resolved server-side — the
// client never needs `deliverables_v2.id`. Tenant-scoped, non-enumerating
// refusals; provenance is returned via headers.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { buildMoveRoadmapDownload } from "@/lib/deliverables/roadmap-move-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moveId: string; format: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (e) {
    return tenancyErrorResponse(e);
  }

  const { moveId, format } = await params;

  if (
    !isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_governed_roadmap_downloads",
    )
  ) {
    return Response.json({ error: "roadmap_not_found" }, { status: 404 });
  }

  const result = await buildMoveRoadmapDownload({
    tenantKey: ctx.clientKey ?? ctx.clientId,
    canReadRestricted: ctx.role === "maestro" || ctx.tenantRole === "maestro",
    moveId,
    format,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.code, detail: result.reason },
      { status: result.httpStatus },
    );
  }

  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const body =
    typeof result.body === "string" ? result.body : new Uint8Array(result.body);
  return new Response(body, {
    status: 200,
    headers: {
      ...result.headers,
      "content-type": result.contentType,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename.replace(/[\r\n"]/g, "_")}"`,
      "cache-control": "private, no-store",
    },
  });
}
