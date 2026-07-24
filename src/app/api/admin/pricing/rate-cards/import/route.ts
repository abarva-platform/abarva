// Nexus Pricing Engine — PR3 governed load · rate-card import (preview) endpoint
//
//   POST /api/admin/pricing/rate-cards/import
//   multipart/form-data: file (the client_rate_card.csv upload), cardCode (optional)
//   → 200 { ok: true, preview: RateCardImportPreview }   (never writes to the DB)
//   → 400 for a malformed request (no file, wrong content type)
//
// Parse/schema errors and semantic-validation errors are NOT request
// failures — they come back as `preview.parseErrors` /
// `preview.validationErrors` (row-level, per the PR3 brief's "show every
// problem row at once" requirement) so the operator can see and fix them,
// then re-upload. The diff (`preview.diff`) and the exact validated lines
// (`preview.linesToCommit`) the operator is agreeing to are both returned —
// the approve endpoint expects the caller to resubmit `linesToCommit`
// unchanged (see that route's header comment for why PR3 has no persisted
// preview-session id to reference instead).
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { previewClientRateCardImport } from "@/lib/pricing/governed-load/rate-card-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_multipart" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "file_too_large", detail: `exceeds ${MAX_FILE_BYTES} bytes` },
      { status: 413 },
    );
  }

  const cardCode = (formData.get("cardCode") as string | null)?.trim() || undefined;
  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  try {
    const csvText = await file.text();
    const preview = await previewClientRateCardImport({ tenantKey, cardCode, csvText });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const status = detail.startsWith("pricing_taxonomy_not_loaded") ? 409 : 500;
    return NextResponse.json(
      { ok: false, error: status === 409 ? "pricing_taxonomy_not_loaded" : "rate_card_import_failed", detail },
      { status },
    );
  }
}
