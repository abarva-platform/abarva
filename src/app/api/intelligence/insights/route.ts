import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  contextCorpusExplorerDisabledResponse,
  isContextCorpusExplorerEnabled,
} from "@/lib/intelligence/context-explorer-access";
import { listContextInsightsForTenant } from "@/lib/intelligence/insight-engine";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }
  if (!isContextCorpusExplorerEnabled(tenancy)) {
    return contextCorpusExplorerDisabledResponse();
  }

  const activeTenantKey = canonicalTenantKey(tenancy.clientKey);
  const requestedTenantKey = request.nextUrl.searchParams.get("tenantKey");
  if (
    requestedTenantKey &&
    canonicalTenantKey(requestedTenantKey) !== activeTenantKey
  ) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }

  const result = await listContextInsightsForTenant(activeTenantKey);
  if (result.errors.length > 0) {
    console.warn("[intelligence/insights] partial read errors", {
      tenantKey: activeTenantKey,
      errors: result.errors,
    });
  }

  return NextResponse.json({
    tenantKey: activeTenantKey,
    insights: result.insights,
    errors: result.errors,
  });
}
