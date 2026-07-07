// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-xlsx
//
// Builds an xlsx file for the given artifact + event, binding context
// from the canvas substrate (event metadata + upstream artifact bodies
// like d05 scope memo and d21 assumption set), and streams the bytes
// back as an attachment download.
//
// Slice 2 ships d19a Pricing Workbook only. Other xlsx-generatable
// codes return 404 with a clear message until their renderer lands.
//
// Auth: requireTenancy + canUploadSourceArtifacts (or canonical-admin
// fallback). Same gate as the body / status / generate endpoints.
//
// GET (not POST) so the browser can navigate directly to the URL and
// trigger a download — no client-side fetch + Blob plumbing required.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import {
  XLSX_CONTENT_TYPE,
  isXlsxGeneratable,
  renderArtifactXlsx,
} from '@/lib/source/exports';
import { buildPricingTemplatePayloadFromContext } from '@/lib/source/exports/payloads/pricing-template-payload';
import { buildAppInventoryPayloadFromContext } from '@/lib/source/exports/payloads/app-inventory-payload';
import { buildResponseChecklistPayloadFromContext } from '@/lib/source/exports/payloads/response-checklist-payload';
import { buildScorecardPayloadFromContext } from '@/lib/source/exports/payloads/scorecard-payload';
import { buildTrapLogPayloadFromContext } from '@/lib/source/exports/payloads/trap-log-payload';
import { buildBafoQuestionPackPayloadFromContext } from '@/lib/source/exports/payloads/bafo-question-pack-payload';
import { buildMarketScanPayloadFromContext } from '@/lib/source/exports/payloads/market-scan-payload';
import { buildTcoIcebergPayloadFromContext } from '@/lib/source/exports/payloads/tco-iceberg-payload';
import { buildAiClauseGapPayloadFromContext } from '@/lib/source/exports/payloads/ai-clause-gap-payload';
import { buildRenewalDecisionPayloadFromContext } from '@/lib/source/exports/payloads/renewal-decision-payload';
import { eventCodeFromPayload } from '@/lib/source/exports/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
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
  const requestedClientId = req.nextUrl.searchParams.get('client');

  if (!isXlsxGeneratable(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `xlsx generation is not yet wired for ${artifactCode}.`,
      },
      { status: 404 },
    );
  }

  const ctx = await buildSourceGenerationContext(eventId, {
    requestedClientId,
  });
  if (!ctx) {
    return Response.json(
      { error: 'not_found', detail: `No source event with slug ${eventId}` },
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
        error: 'forbidden',
        detail: 'Source artifact rights are required to export xlsx templates.',
      },
      { status: 403 },
    );
  }

  // Build payload + render workbook.
  const generatedAt = new Date().toISOString();
  let workbook;
  let payload: unknown;
  try {
    switch (artifactCode) {
      case 'd19_pricing_workbook':
        payload = buildPricingTemplatePayloadFromContext(ctx, generatedAt);
        break;
      case 'd04_app_inv':
        payload = buildAppInventoryPayloadFromContext(ctx, generatedAt);
        break;
      case 'd11_response_checklist':
        payload = buildResponseChecklistPayloadFromContext(ctx, generatedAt);
        break;
      case 'd16_scorecard':
        payload = buildScorecardPayloadFromContext(ctx, generatedAt);
        break;
      case 'd20_trap_log':
        payload = buildTrapLogPayloadFromContext(ctx, generatedAt);
        break;
      case 'd22_bafo_question_pack':
        payload = buildBafoQuestionPackPayloadFromContext(ctx, generatedAt);
        break;
      case 'dx2_market_scan':
        payload = await buildMarketScanPayloadFromContext(ctx, generatedAt);
        break;
      case 'dx4_tco_iceberg':
        payload = buildTcoIcebergPayloadFromContext(ctx, generatedAt);
        break;
      case 'dx6a_ai_clause_gap':
        payload = buildAiClauseGapPayloadFromContext(ctx, generatedAt);
        break;
      case 'dx7_renewal_decision':
        payload = await buildRenewalDecisionPayloadFromContext(ctx, generatedAt);
        break;
      default:
        // Defensive — isXlsxGeneratable should have caught this above.
        return Response.json(
          { error: 'unsupported_artifact', detail: artifactCode },
          { status: 404 },
        );
    }
    workbook = await renderArtifactXlsx({ artifactCode, payload });
  } catch (err) {
    console.error(
      '[GET /api/v1/source/:eventId/artifacts/:artifactCode/render-xlsx] renderer error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'xlsx renderer failed',
      },
      { status: 500 },
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const responseEventCode = eventCodeFromPayload(payload, ctx.event.code);
  const filename = `${artifactCode}__${responseEventCode}__${generatedAt.slice(0, 10)}.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': XLSX_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': responseEventCode,
    },
  });
}
