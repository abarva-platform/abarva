// GET /api/v1/programs/:programId/deliverables/:deliverableId/roadmap/:format?version=N
//
// PR10 — governed roadmap download. Serves the executive PPTX, detailed DOCX,
// HTML preview, and (restricted) contract/provenance JSON by RE-RENDERING the
// persisted RoadmapPresentationContract — never regenerating. Tenant-scoped,
// non-enumerating refusals; restricted formats require admin/audit access.
//
// The authorize + render + response logic is the fully unit-tested pure
// composer (roadmap-download-service). This handler is the thin adapter:
// tenancy → requester, loader → target, composer → Response.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../../_auth";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { composeRoadmapDownload } from "@/lib/deliverables/roadmap-download-service";
import { loadPersistedRoadmapRecord } from "@/lib/deliverables/load-persisted-roadmap-record";
import type { RoadmapDownloadFormat } from "@/lib/deliverables/roadmap-artifact-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORMATS: ReadonlySet<string> = new Set([
  "pptx",
  "docx",
  "html",
  "contract",
  "provenance",
]);

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      programId: string;
      deliverableId: string;
      format: string;
    }>;
  },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (e) {
    return tenancyErrorResponse(e);
  }

  const { programId, deliverableId, format } = await params;

  // Feature gate: when off for this tenant, behave as if the surface doesn't
  // exist (non-enumerating) rather than advertising an unfinished capability.
  if (
    !isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_governed_roadmap_downloads",
    )
  ) {
    return Response.json({ error: "roadmap_not_found" }, { status: 404 });
  }

  if (!FORMATS.has(format)) {
    return Response.json(
      { error: "unsupported_format", detail: `Unknown format "${format}".` },
      { status: 400 },
    );
  }

  const tenantKey = ctx.clientKey ?? ctx.clientId;
  const canReadRestricted =
    ctx.role === "maestro" || ctx.tenantRole === "maestro";

  const versionParam = req.nextUrl.searchParams.get("version");
  const requestedVersion =
    versionParam && /^\d+$/.test(versionParam)
      ? Number(versionParam)
      : undefined;

  const target = await loadPersistedRoadmapRecord({
    tenantKey,
    moveId: programId,
    deliverableId,
    requestedVersion,
  });

  const result = await composeRoadmapDownload({
    requester: { tenantKey, canReadRestricted },
    target,
    format: format as RoadmapDownloadFormat,
    requestedVersion,
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
      "content-type": result.contentType,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename.replace(/[\r\n"]/g, "_")}"`,
      "cache-control": "private, no-store",
    },
  });
}
