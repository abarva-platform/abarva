import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  contextCorpusExplorerDisabledResponse,
  isContextCorpusExplorerEnabled,
} from "@/lib/intelligence/context-explorer-access";
import { runInsightEvaluation } from "@/lib/intelligence/insight-engine";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function canEvaluate(
  role: string | null | undefined,
  tenantRole: string | null | undefined,
): boolean {
  return [role, tenantRole].some((value) =>
    [
      "admin",
      "maestro",
      "client_admin",
      "tenant_admin",
      "abarva_super_admin",
    ].includes(String(value ?? "")),
  );
}

export async function POST(request: NextRequest) {
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
  if (!canEvaluate(tenancy.role, tenancy.tenantRole)) {
    return NextResponse.json(
      { error: "forbidden_operator_only" },
      { status: 403 },
    );
  }

  const activeTenantKey = canonicalTenantKey(tenancy.clientKey);
  const body = await request.json().catch(() => ({}));
  const requestedTenantKey =
    typeof body.tenantKey === "string"
      ? body.tenantKey
      : request.nextUrl.searchParams.get("tenantKey");
  if (
    requestedTenantKey &&
    canonicalTenantKey(requestedTenantKey) !== activeTenantKey
  ) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }

  const receipt = await runInsightEvaluation(activeTenantKey);
  if (receipt.errors.length > 0) {
    console.warn(
      "[intelligence/insights/evaluate] completed with errors",
      receipt,
    );
  }
  return NextResponse.json(receipt);
}
