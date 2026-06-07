import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { scanLandingZone, azureLandingZoneLister } from "@/lib/context-ingestion/loader/landing-zone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin Loader — landing-zone scan. Lists originals IT staged directly in Azure
 * Blob (the Storage-Explorer exception path) under this tenant's prefix, so the
 * Loader can pick them up. Strictly tenant-scoped.
 */
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

  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  try {
    const scan = await scanLandingZone({ tenantKey, lister: azureLandingZoneLister() });
    return NextResponse.json({ ok: true, ...scan }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: "loader_landing_zone_scan_failed", detail }, { status: 500 });
  }
}
