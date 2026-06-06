import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { readBulkContextUploadJobStatus } from "@/lib/context-ingestion/bulk-context-upload-status";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function queryString(request: NextRequest, key: string): string | null {
  const value = request.nextUrl.searchParams.get(key)?.trim();
  return value ? value : null;
}

export async function GET(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  const clientId = queryString(request, "clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  if (clientId !== tenancy.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  const jobId = queryString(request, "jobId");
  if (!jobId || !/^bulk-[a-f0-9]{16}$/.test(jobId)) {
    return NextResponse.json({ error: "invalid_job_id" }, { status: 400 });
  }

  try {
    const status = await readBulkContextUploadJobStatus({
      clientId: tenancy.clientId,
      tenantKey: canonicalTenantKey(tenancy.clientKey),
      jobId,
    });
    return NextResponse.json({ ok: true, status }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const notFound =
      detail.includes("BlobNotFound") ||
      detail.includes("The specified blob does not exist");
    return NextResponse.json(
      {
        ok: false,
        error: notFound ? "bulk_upload_status_not_found" : "bulk_upload_status_failed",
        detail,
      },
      { status: notFound ? 404 : 500 },
    );
  }
}
