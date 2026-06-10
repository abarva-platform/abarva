// GET /api/v1/programs/:programId/artifacts/:artifactId/download
// Redirects to a short-lived signed Azure Blob URL for the artifact (tenant-
// scoped). The File Cabinet download/open action points here.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { getArtifactSignedUrl } from "@/lib/programs/deliverables/move-artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { artifactId } = await params;
    const ctx = await requireTenancy();
    const signed = await getArtifactSignedUrl(ctx, artifactId);
    if (!signed) {
      return Response.json(
        {
          error: "artifact_unavailable",
          detail: "not found or storage unconfigured",
        },
        { status: 404 },
      );
    }
    return Response.redirect(signed.url, 302);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
