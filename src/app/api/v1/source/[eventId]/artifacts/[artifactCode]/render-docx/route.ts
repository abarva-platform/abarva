// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-docx
//
// Builds a docx file for the given artifact + event, binding context
// from the canvas substrate (event metadata + authored / scaffold
// markdown body), and streams the bytes back as an attachment download.
//
// Slice 3.1 shipped d05 Scope Memo. Slice 3.2 adds d09 RFP Package,
// d24 Atlas Decision Brief, d27 Selection Memo — all narrative
// markdown bodies that share the same renderer + binder pattern.
//
// Auth: same gate as render-xlsx (requireTenancy +
// canUploadSourceArtifacts | canGenerateSourcingArtifacts | canonical-
// admin fallback).

import type { NextRequest } from "next/server";
import { Packer } from "docx";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";
import {
  DOCX_CONTENT_TYPE,
  isDocxGeneratable,
  renderArtifactDocx,
} from "@/lib/source/exports";
import { buildNarrativeDocxPayloadFromContext } from "@/lib/source/exports/payloads/narrative-docx-payload";
import { buildAppInventoryPayloadFromContext } from "@/lib/source/exports/payloads/app-inventory-payload";
import { buildResponseChecklistPayloadFromContext } from "@/lib/source/exports/payloads/response-checklist-payload";
import { buildScorecardPayloadFromContext } from "@/lib/source/exports/payloads/scorecard-payload";
import { buildPricingTemplatePayloadFromContext } from "@/lib/source/exports/payloads/pricing-template-payload";
import { buildTrapLogPayloadFromContext } from "@/lib/source/exports/payloads/trap-log-payload";
import { buildBafoQuestionPackPayloadFromContext } from "@/lib/source/exports/payloads/bafo-question-pack-payload";
import { buildMarketScanPayloadFromContext } from "@/lib/source/exports/payloads/market-scan-payload";
import { buildTcoIcebergPayloadFromContext } from "@/lib/source/exports/payloads/tco-iceberg-payload";
import { buildAiClauseGapPayloadFromContext } from "@/lib/source/exports/payloads/ai-clause-gap-payload";
import { buildRenewalDecisionPayloadFromContext } from "@/lib/source/exports/payloads/renewal-decision-payload";
import { buildDemandChallengePayloadFromContext } from "@/lib/source/exports/payloads/demand-challenge-payload";
import { buildSourcingApproachPayloadFromContext } from "@/lib/source/exports/payloads/sourcing-approach-payload";
import { buildVendorRiskPackPayloadFromContext } from "@/lib/source/exports/payloads/vendor-risk-pack-payload";
import { eventCodeFromPayload } from "@/lib/source/exports/metadata";

const NARRATIVE_CODES = new Set([
  "d01_strategy_memo",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d13_vendor_responses",
  "d24_decision_brief",
  "d27_selection_memo",
  "dx0_demand_challenge",
  "dx1_sourcing_approach",
  "dx6b_vendor_risk_pack",
]);

// Lifecycle-coverage narrative payloads — same NarrativeDocxPayload
// shape as d05/d09/d24/d27 but with substrate-grounded scaffold
// builders bound asynchronously.
const LIFECYCLE_NARRATIVE_BUILDERS: Record<
  string,
  (
    ctx: Awaited<ReturnType<typeof buildSourceGenerationContext>> & object,
    at: string,
  ) => Promise<unknown>
> = {
  dx0_demand_challenge: buildDemandChallengePayloadFromContext,
  dx1_sourcing_approach: buildSourcingApproachPayloadFromContext,
  dx6b_vendor_risk_pack: buildVendorRiskPackPayloadFromContext,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function GET(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;
  const requestedClientId = req.nextUrl.searchParams.get("client");

  if (!isDocxGeneratable(artifactCode)) {
    return Response.json(
      {
        error: "unsupported_artifact",
        detail: `docx generation is not yet wired for ${artifactCode}.`,
      },
      { status: 404 },
    );
  }

  const ctx = await buildSourceGenerationContext(eventId, {
    requestedClientId,
  });
  if (!ctx) {
    return Response.json(
      { error: "not_found", detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow(requestedClientId).catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: ctx.event.id,
        }).catch(() => null)
      : null;
  const canonicalAdminFallbackAllowed =
    !activeClient && isCanonicalClientAdminEmail(currentUser?.email);
  const canExport = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
    accessPolicy?.canGenerateSourcingArtifacts ||
    canonicalAdminFallbackAllowed,
  );
  if (!canExport) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: "forbidden",
        detail: "Source artifact rights are required to export docx documents.",
      },
      { status: 403 },
    );
  }

  // Build payload + render. Narrative artifacts (d05/d09/d24/d27) use
  // the shared narrative payload shape; structured-data artifacts
  // (d04/d11/d16) reuse the same payload binders that the xlsx
  // pipeline uses.
  const generatedAt = new Date().toISOString();
  let document;
  let payload: unknown;
  try {
    if (LIFECYCLE_NARRATIVE_BUILDERS[artifactCode]) {
      payload = await LIFECYCLE_NARRATIVE_BUILDERS[artifactCode]!(
        ctx,
        generatedAt,
      );
    } else if (NARRATIVE_CODES.has(artifactCode)) {
      payload = buildNarrativeDocxPayloadFromContext(
        ctx,
        artifactCode,
        generatedAt,
      );
    } else if (artifactCode === "d04_app_inv") {
      payload = buildAppInventoryPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "d11_response_checklist") {
      payload = buildResponseChecklistPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "d16_scorecard") {
      payload = buildScorecardPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "d19_pricing_workbook") {
      payload = buildPricingTemplatePayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "d20_trap_log") {
      payload = buildTrapLogPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "d22_bafo_question_pack") {
      payload = buildBafoQuestionPackPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "dx2_market_scan") {
      payload = await buildMarketScanPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "dx4_tco_iceberg") {
      payload = buildTcoIcebergPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "dx6a_ai_clause_gap") {
      payload = buildAiClauseGapPayloadFromContext(ctx, generatedAt);
    } else if (artifactCode === "dx7_renewal_decision") {
      payload = await buildRenewalDecisionPayloadFromContext(ctx, generatedAt);
    } else {
      // Defensive — isDocxGeneratable should have caught this.
      return Response.json(
        { error: "unsupported_artifact", detail: artifactCode },
        { status: 404 },
      );
    }
    document = await renderArtifactDocx({ artifactCode, payload });
  } catch (err) {
    console.error(
      "[GET /api/v1/source/:eventId/artifacts/:artifactCode/render-docx] renderer error",
      err,
    );
    return Response.json(
      {
        error: "render_failed",
        detail: err instanceof Error ? err.message : "docx renderer failed",
      },
      { status: 500 },
    );
  }

  const buffer = await Packer.toBuffer(document);
  const responseEventCode = eventCodeFromPayload(payload, ctx.event.code);
  const filename = `${artifactCode}__${responseEventCode}__${generatedAt.slice(0, 10)}.docx`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "content-type": DOCX_CONTENT_TYPE,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-source-artifact-code": artifactCode,
      "x-source-event-code": responseEventCode,
      "x-source-artifact-format": "docx",
    },
  });
}
