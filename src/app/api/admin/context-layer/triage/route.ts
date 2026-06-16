import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TriageRecord {
  id: string;
  title: string;
  record_type: string;
  record_subtype: string | null;
  domain_segment: string | null;
  business_function: string | null;
  criticality: string | null;
  source_system: string;
  source_file: string | null;
  owner: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

function canManageContextTriage(
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

export async function GET() {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }
  if (!canManageContextTriage(tenancy.role, tenancy.tenantRole)) {
    return NextResponse.json(
      { error: "forbidden_operator_only" },
      { status: 403 },
    );
  }

  const db = getAzureReadFluentClient();
  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  const result = await db
    .from<TriageRecord[]>("enterprise_context_records")
    .select(
      "id, title, record_type, record_subtype, domain_segment, business_function, criticality, source_system, source_file, owner, created_at, payload",
    )
    .eq("tenant_key", tenantKey)
    .eq("classification_source", "NEEDS_CLASSIFICATION")
    .eq("lifecycle_state", "review")
    .order("created_at", { ascending: false })
    .limit(200);

  if (result.error) {
    console.error("[triage/GET] db error", result.error);
    return NextResponse.json(
      { error: "db_error", detail: result.error.message },
      { status: 500 },
    );
  }

  const records = (result.data ?? []) as TriageRecord[];

  return NextResponse.json({ records, total: records.length });
}
