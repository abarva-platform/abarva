// GET /api/v1/programs/:programId/artifacts/:artifactId/trace
// Returns the MoveContextBundleTrace for a generated artifact (the audit
// provenance — evidence sources, citations, claims supported/unsupported,
// model/passes, quality, grounding status). Tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { artifactId } = await params;
    const ctx = await requireTenancy();
    const tenantKey = ctx.clientKey ?? "";
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("move_artifacts")
      .select("artifact_type, title, tenant_key, metadata")
      .eq("artifact_id", artifactId)
      .maybeSingle();
    if (error || !data)
      return Response.json({ error: "not_found" }, { status: 404 });
    const row = data as {
      artifact_type: string;
      title: string;
      tenant_key: string;
      metadata: { contextBundleTrace?: unknown } | null;
    };
    if (row.tenant_key !== tenantKey)
      return Response.json({ error: "forbidden" }, { status: 403 });
    const trace = row.metadata?.contextBundleTrace ?? null;
    if (!trace)
      return Response.json(
        {
          ok: true,
          trace: null,
          detail: "no context-bundle trace recorded for this artifact",
        },
        { status: 200 },
      );
    return Response.json({ ok: true, artifactType: row.artifact_type, trace });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
