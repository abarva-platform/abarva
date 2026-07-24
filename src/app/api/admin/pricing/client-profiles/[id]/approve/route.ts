// Nexus Pricing Engine — PR3 governed load · client pricing profile approve/commit
//
//   POST /api/admin/pricing/client-profiles/:id/approve
//   JSON body: { values: {assumptionKey, assumptionValue}[], approvalRationale?: string }
//   → 200 { ok: true, result: CreateClientProfileVersionResult }
//
// `:id` is unused (client profiles are one-per-tenant, not code-scoped like
// rate cards) — accepted for URL-shape symmetry with the rate-card approve
// route and reserved for a future multi-profile-per-tenant scenario. See
// `../../../rate-cards/[id]/approve/route.ts`'s header comment for why the
// operator resubmits the previewed values rather than referencing a
// persisted preview-session id.
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { commitClientPricingProfileImport } from "@/lib/pricing/governed-load/client-profile-import";
import type { NewClientProfileValueInput } from "@/lib/pricing/governed-load/client-profile-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidValue(value: unknown): value is NewClientProfileValueInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.assumptionKey === "string" && "assumptionValue" in v;
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  let body: { values?: unknown; approvalRationale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json_body" }, { status: 400 });
  }

  if (!Array.isArray(body.values) || body.values.length === 0) {
    return NextResponse.json({ ok: false, error: "values_required" }, { status: 400 });
  }
  if (!body.values.every(isValidValue)) {
    return NextResponse.json({ ok: false, error: "values_invalid_shape" }, { status: 400 });
  }

  const tenantKey = canonicalTenantKey(tenancy.clientKey);
  const approvalRationale =
    typeof body.approvalRationale === "string" ? body.approvalRationale : undefined;

  try {
    const result = await commitClientPricingProfileImport({
      tenantKey,
      values: body.values,
      approvedBy: tenancy.userId,
      approvalRationale,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "client_profile_approve_failed", detail },
      { status: 500 },
    );
  }
}
