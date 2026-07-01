// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-pdf
//
// Returns a print-ready PDF for an authored narrative artifact (d05 /
// d09 / d24 / d27). Companion to render-docx + render-html — same
// payload binder, different output format.
//
// Slice 4.2 — adds PDF as the third "view-or-share" format alongside
// HTML. Where HTML is best for email links and PDF is best for
// archives + signatures.
//
// Auth: same gate as the other render-* routes. Sets Content-
// Disposition: attachment so the browser downloads rather than
// renders.

import type { NextRequest } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";
import {
  PDF_CONTENT_TYPE,
  isPdfGeneratable,
  renderArtifactPdf,
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
import {
  DECISION_BRIEF_PDF_CONFIG,
  DEMAND_CHALLENGE_PDF_CONFIG,
  RFP_PACK_PDF_CONFIG,
  SCOPE_MEMO_PDF_CONFIG,
  SELECTION_MEMO_PDF_CONFIG,
  SOURCING_APPROACH_PDF_CONFIG,
  STRATEGY_MEMO_PDF_CONFIG,
  VENDOR_RESPONSE_PACK_PDF_CONFIG,
  VENDOR_RISK_PACK_PDF_CONFIG,
  buildNarrativePdf,
} from "@/lib/source/exports/renderers/narrative-pdf";
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

/** Build the payload for the given artifact code from substrate.
 *
 *  Returns a Promise — some lifecycle binders are async (broker-backed).
 *  Existing narrative + structured binders that are synchronous resolve
 *  immediately. */
async function buildPdfPayload(
  ctx: Awaited<ReturnType<typeof buildSourceGenerationContext>> & object,
  artifactCode: string,
  generatedAt: string,
): Promise<unknown> {
  // Lifecycle-wave narrative artifacts use the same NarrativeDocxPayload
  // shape as d05/d09/d24/d27 but bind asynchronously via the broker.
  if (artifactCode === "dx0_demand_challenge") {
    return buildDemandChallengePayloadFromContext(ctx, generatedAt);
  }
  if (artifactCode === "dx1_sourcing_approach") {
    return buildSourcingApproachPayloadFromContext(ctx, generatedAt);
  }
  if (artifactCode === "dx6b_vendor_risk_pack") {
    return buildVendorRiskPackPayloadFromContext(ctx, generatedAt);
  }
  if (NARRATIVE_CODES.has(artifactCode)) {
    return buildNarrativeDocxPayloadFromContext(ctx, artifactCode, generatedAt);
  }
  switch (artifactCode) {
    case "d04_app_inv":
      return buildAppInventoryPayloadFromContext(ctx, generatedAt);
    case "d11_response_checklist":
      return buildResponseChecklistPayloadFromContext(ctx, generatedAt);
    case "d16_scorecard":
      return buildScorecardPayloadFromContext(ctx, generatedAt);
    case "d19_pricing_workbook":
      return buildPricingTemplatePayloadFromContext(ctx, generatedAt);
    case "d20_trap_log":
      return buildTrapLogPayloadFromContext(ctx, generatedAt);
    case "d22_bafo_question_pack":
      return buildBafoQuestionPackPayloadFromContext(ctx, generatedAt);
    case "dx2_market_scan":
      return buildMarketScanPayloadFromContext(ctx, generatedAt);
    case "dx4_tco_iceberg":
      return buildTcoIcebergPayloadFromContext(ctx, generatedAt);
    case "dx6a_ai_clause_gap":
      return buildAiClauseGapPayloadFromContext(ctx, generatedAt);
    case "dx7_renewal_decision":
      return buildRenewalDecisionPayloadFromContext(ctx, generatedAt);
    default:
      throw new Error(`No PDF payload binder for ${artifactCode}`);
  }
}

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

  if (!isPdfGeneratable(artifactCode)) {
    return Response.json(
      {
        error: "unsupported_artifact",
        detail: `PDF generation is not yet wired for ${artifactCode}.`,
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
        detail: "Source artifact rights are required to export PDF documents.",
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  let payload: unknown;
  try {
    payload = await buildPdfPayload(ctx, artifactCode, generatedAt);
  } catch (err) {
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error ? err.message : "PDF payload binder failed",
      },
      { status: 500 },
    );
  }
  const isNarrative = NARRATIVE_CODES.has(artifactCode);

  // Strategy: try the full render first. For narrative artifacts, if
  // @react-pdf throws — typically pdfkit's "unsupported number" float-
  // overflow on long / structurally-complex bodies — fall back to a
  // degraded cover-only render with a notice pointing the user at docx
  // + html for the full content. Structured artifacts render from
  // bounded tables and have no degraded mode.
  const renderToBuffer = async (degraded: boolean): Promise<Buffer> => {
    const element = degraded
      ? buildNarrativePdf(
          payload as Parameters<typeof buildNarrativePdf>[0],
          configForCode(artifactCode),
          { degraded: true },
        )
      : renderArtifactPdf({ artifactCode, payload });
    const stream = await pdf(element).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  };

  let buffer: Buffer;
  let degraded = false;
  try {
    buffer = await renderToBuffer(false);
  } catch (err) {
    if (!isNarrative) {
      console.error("[render-pdf] structured artifact PDF render threw", err);
      return Response.json(
        {
          error: "render_failed",
          detail: err instanceof Error ? err.message : "PDF renderer failed",
        },
        { status: 500 },
      );
    }
    console.warn(
      "[render-pdf] full-body render threw; falling back to degraded cover-only",
      { artifactCode, error: err instanceof Error ? err.message : String(err) },
    );
    try {
      buffer = await renderToBuffer(true);
      degraded = true;
    } catch (fallbackErr) {
      console.error(
        "[render-pdf] degraded cover-only fallback also threw",
        fallbackErr,
      );
      return Response.json(
        {
          error: "render_failed",
          detail:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "PDF renderer failed",
        },
        { status: 500 },
      );
    }
  }

  const responseEventCode = eventCodeFromPayload(payload, ctx.event.code);
  const filename = `${artifactCode}__${responseEventCode}__${generatedAt.slice(0, 10)}.pdf`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "content-type": PDF_CONTENT_TYPE,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-source-artifact-code": artifactCode,
      "x-source-event-code": responseEventCode,
      "x-source-artifact-format": "pdf",
      ...(degraded ? { "x-source-pdf-degraded": "true" } : {}),
    },
  });
}

/**
 * Map an artifact code to its PDF config. Mirrors the dispatcher in
 * src/lib/source/exports/index.ts but exposed locally so the route can
 * invoke the degraded-mode renderer with the right per-artifact config.
 */
function configForCode(artifactCode: string) {
  switch (artifactCode) {
    case "d01_strategy_memo":
      return STRATEGY_MEMO_PDF_CONFIG;
    case "d05_scope_memo":
      return SCOPE_MEMO_PDF_CONFIG;
    case "d09_rfp_pack":
      return RFP_PACK_PDF_CONFIG;
    case "d13_vendor_responses":
      return VENDOR_RESPONSE_PACK_PDF_CONFIG;
    case "d24_decision_brief":
      return DECISION_BRIEF_PDF_CONFIG;
    case "d27_selection_memo":
      return SELECTION_MEMO_PDF_CONFIG;
    case "dx0_demand_challenge":
      return DEMAND_CHALLENGE_PDF_CONFIG;
    case "dx1_sourcing_approach":
      return SOURCING_APPROACH_PDF_CONFIG;
    case "dx6b_vendor_risk_pack":
      return VENDOR_RISK_PACK_PDF_CONFIG;
    default:
      throw new Error(`No PDF config for ${artifactCode}`);
  }
}
