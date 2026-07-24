// Nexus Pricing Engine — PR3 governed load · rate-card list endpoint
//
//   GET /api/admin/pricing/rate-cards?cardCode=ENTERPRISE
//   → { ok: true, tenantKey, cardCode, global: RateCardSummary[], client: RateCardSummary[] }
//
// Auth/tenancy: `requireTenancy()` + `tenancyErrorResponse()`
// (`@/lib/auth/tenancy`) — the same convention as
// `src/app/api/admin/context-layer/loader/commit/route.ts` (the closest
// existing structural analog: a governed parse -> validate -> preview ->
// approve -> commit pipeline). Lists are always scoped to the caller's own
// tenant; there is no cross-tenant listing surface here.
import { NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { listRateCardVersions } from "@/lib/pricing/rate-card-repository";
import type { PricingRateCardRow } from "@/lib/pricing/types";
import {
  CLIENT_ENTERPRISE_RATE_CARD_CODE,
  GLOBAL_STARTER_RATE_CARD_CODE,
} from "@/lib/pricing/governed-load/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RateCardSummary {
  id: string;
  cardCode: string;
  version: number;
  isCurrent: boolean;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
}

function toSummary(row: PricingRateCardRow): RateCardSummary {
  return {
    id: row.id,
    cardCode: row.card_code,
    version: row.version,
    isCurrent: row.is_current,
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const cardCode = url.searchParams.get("cardCode")?.trim() || CLIENT_ENTERPRISE_RATE_CARD_CODE;

  try {
    const [global, client] = await Promise.all([
      listRateCardVersions("global", null, GLOBAL_STARTER_RATE_CARD_CODE),
      listRateCardVersions("client", tenantKey, cardCode),
    ]);

    return NextResponse.json({
      ok: true,
      tenantKey,
      cardCode,
      global: global.map(toSummary),
      client: client.map(toSummary),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "rate_card_list_failed", detail },
      { status: 500 },
    );
  }
}
