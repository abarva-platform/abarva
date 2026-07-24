// Nexus Pricing Engine — PR3 governed load · rate-card approve/commit endpoint
//
//   POST /api/admin/pricing/rate-cards/:id/approve
//   JSON body: { lines: NewRateCardLineInput[], approvalRationale?: string }
//   → 200 { ok: true, result: CreateRateCardVersionResult }
//
// `:id` is the rate card's `card_code` (e.g. "ENTERPRISE"), not a database
// row id — PR3 does not introduce an ephemeral "import preview session"
// table (that would be new infrastructure beyond this PR's scope), so there
// is nothing else to reference by id yet. The operator resubmits exactly the
// `linesToCommit` array the `import` endpoint returned in its preview; this
// route re-validates nothing about WHICH lines are being approved beyond
// what `createRateCardVersion` itself does (role/level resolution already
// happened at preview time, and PR2's idempotency contract — same content
// hash as current is a no-op — is the backstop against a stale/tampered
// resubmission producing a spurious new version).
//
// A future PR could add a persisted preview-session id if operators need to
// approve asynchronously from a different browser session than the one that
// ran the preview — out of scope here (see the PR3 release record's Known
// Gaps).
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { commitClientRateCardImport } from "@/lib/pricing/governed-load/rate-card-import";
import type { NewRateCardLineInput } from "@/lib/pricing/rate-card-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidLine(value: unknown): value is NewRateCardLineInput {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.roleOrBandRef === "string" &&
    typeof line.rateBasis === "string" &&
    typeof line.unit === "string" &&
    typeof line.rateValue === "number" &&
    typeof line.validFrom === "string"
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
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

  const { id: cardCode } = await context.params;
  if (!cardCode?.trim()) {
    return NextResponse.json({ ok: false, error: "card_code_required" }, { status: 400 });
  }

  let body: { lines?: unknown; approvalRationale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json_body" }, { status: 400 });
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ ok: false, error: "lines_required" }, { status: 400 });
  }
  if (!body.lines.every(isValidLine)) {
    return NextResponse.json({ ok: false, error: "lines_invalid_shape" }, { status: 400 });
  }

  const tenantKey = canonicalTenantKey(tenancy.clientKey);
  const approvalRationale =
    typeof body.approvalRationale === "string" ? body.approvalRationale : undefined;

  try {
    const result = await commitClientRateCardImport({
      tenantKey,
      cardCode,
      lines: body.lines,
      approvedBy: tenancy.userId,
      approvalRationale,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "rate_card_approve_failed", detail },
      { status: 500 },
    );
  }
}
