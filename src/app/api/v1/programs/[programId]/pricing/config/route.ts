// GET /api/v1/programs/:programId/pricing/config
//
// Archetype list + the required-input schema per archetype (brief §10),
// derived from PR4's REAL archetype→activity-pack→driver mapping via
// `buildEstimateConfig` — never a hardcoded per-archetype question list.
// Also resolves the tenant's current committed ("ENTERPRISE") rate-card
// version, if one exists, so step 1 of the wizard can default the rate-card
// selection rather than presenting a full rate-card picker (a deliberate
// V1 scoping call — see the PR5 release record: multi-rate-card selection
// is deferred, not silently omitted).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { readEffortEnginePack, getCurrentModelVersion } from "@/lib/pricing/effort-engine";
import { buildEstimateConfig } from "@/lib/pricing/moves-workflow";
import { getCurrentRateCard } from "@/lib/pricing/rate-card-repository";
import { CLIENT_ENTERPRISE_RATE_CARD_CODE } from "@/lib/pricing/governed-load/constants";
import { requireOwnedMove, tenantKeyFor } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;

    const move = await requireOwnedMove(ctx, programId);
    if (!move) return Response.json({ error: "not_found" }, { status: 404 });

    const modelVersionRow = await getCurrentModelVersion();
    if (!modelVersionRow) {
      return Response.json(
        { error: "pricing_model_not_loaded", detail: "No current pricing_model_versions row — run the PR4 reference-pack loader first." },
        { status: 503 },
      );
    }

    const pack = await readEffortEnginePack(modelVersionRow.version);
    const config = buildEstimateConfig(pack);

    const rateCard = await getCurrentRateCard("client", tenantKeyFor(ctx), CLIENT_ENTERPRISE_RATE_CARD_CODE);

    return Response.json({
      ok: true,
      programId,
      config,
      defaultRateCard: rateCard ? { id: rateCard.id, cardCode: rateCard.card_code, version: rateCard.version } : null,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/programs/:programId/pricing/config]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
