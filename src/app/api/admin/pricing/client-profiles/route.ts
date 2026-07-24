// Nexus Pricing Engine — PR3 governed load · client pricing profile GET endpoint
//
//   GET /api/admin/pricing/client-profiles
//   → { ok: true, tenantKey, profile: { version, status, values } | null }
//
// Mirrors `src/app/api/admin/pricing/rate-cards/route.ts`'s auth/tenancy
// convention. Not one of the brief §10 routes explicitly named for PR3, but
// added for symmetry since PR3's governed-load pipeline builds a full
// client-profile parse/validate/diff/approve/commit path
// (`src/lib/pricing/governed-load/client-profile-import.ts`) alongside the
// rate-card one — see the PR3 release record.
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import {
  getCurrentClientProfile,
  listClientProfileValues,
} from "@/lib/pricing/governed-load/client-profile-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const profile = await getCurrentClientProfile(tenantKey);
    if (!profile) {
      return NextResponse.json({ ok: true, tenantKey, profile: null });
    }
    const values = await listClientProfileValues(profile.id);
    return NextResponse.json({
      ok: true,
      tenantKey,
      profile: {
        version: profile.profile_version,
        status: profile.status,
        values: values.map((v) => ({
          assumptionKey: v.assumption_key,
          assumptionValue: v.assumption_value,
        })),
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "client_profile_list_failed", detail },
      { status: 500 },
    );
  }
}
