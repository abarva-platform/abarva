// Nexus Pricing Engine — PR3 governed load · client pricing profile import (preview)
//
//   POST /api/admin/pricing/client-profiles/import
//   multipart/form-data: file (the client_pricing_profile.csv upload)
//   → 200 { ok: true, preview: ClientProfileImportPreview }  (never writes to the DB)
//
// See `../../rate-cards/import/route.ts`'s header comment — same shape,
// scoped to `pricing_client_profile_values` instead of rate-card lines.
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { previewClientPricingProfileImport } from "@/lib/pricing/governed-load/client-profile-import";

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

  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  try {
    const csvText = await file.text();
    const preview = await previewClientPricingProfileImport({ tenantKey, csvText });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "client_profile_import_failed", detail },
      { status: 500 },
    );
  }
}
