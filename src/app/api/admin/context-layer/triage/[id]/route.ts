import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DOMAIN_SEGMENTS = [
  "DATA_ANALYTICS",
  "ERP",
  "DIGITAL_CX",
  "OPERATIONS",
  "INFRASTRUCTURE",
  "SECURITY_IDENTITY",
  "HR_WORKFORCE",
  "COLLABORATION",
] as const;

type DomainSegment = (typeof VALID_DOMAIN_SEGMENTS)[number];

function isDomainSegment(value: unknown): value is DomainSegment {
  return (
    typeof value === "string" &&
    (VALID_DOMAIN_SEGMENTS as readonly string[]).includes(value)
  );
}

interface PatchBody {
  domainSegment: string;
  businessFunction?: string;
  criticality?: string;
}

function parsePatchBody(raw: unknown): PatchBody | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "body_required" };
  }
  const body = raw as Record<string, unknown>;
  if (!isDomainSegment(body.domainSegment)) {
    return {
      error: `invalid_domain_segment: must be one of ${VALID_DOMAIN_SEGMENTS.join(", ")}`,
    };
  }
  return {
    domainSegment: body.domainSegment,
    businessFunction:
      typeof body.businessFunction === "string"
        ? body.businessFunction
        : undefined,
    criticality:
      typeof body.criticality === "string" ? body.criticality : undefined,
  };
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parsePatchBody(rawBody);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    domain_segment: parsed.domainSegment,
    classification_source: "OPERATOR_CONFIRMED",
    lifecycle_state: "active",
    updated_at: new Date().toISOString(),
  };
  if (parsed.businessFunction !== undefined) {
    updatePayload.business_function = parsed.businessFunction;
  }
  if (parsed.criticality !== undefined) {
    updatePayload.criticality = parsed.criticality;
  }

  const db = getAzureWriteFluentClient();

  const result = await db
    .from("enterprise_context_records")
    .update(updatePayload)
    .eq("id", id)
    .eq("tenant_key", tenantKey)
    .eq("classification_source", "NEEDS_CLASSIFICATION")
    .select("id");

  if (result.error) {
    console.error("[triage/PATCH] db error", result.error);
    return NextResponse.json(
      { error: "db_error", detail: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    domainSegment: parsed.domainSegment,
  });
}
