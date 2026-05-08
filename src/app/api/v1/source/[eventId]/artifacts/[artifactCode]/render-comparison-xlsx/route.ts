// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-comparison-xlsx
//
// Builds the d19c Pricing Normalization Comparison workbook for the
// given artifact + event. Today only d19_pricing_workbook supports
// comparison rendering; other codes return 404 so the route surface
// stays explicit.
//
// Slice 2c.1: vendor submissions are synthesized in DEMO MODE so the
// renderer can be exercised on prod without the upload-back path.
// Slice 2c.2 will swap in real submissions from the substrate.
//
// Auth: same gate as render-xlsx (canUploadSourceArtifacts ||
// canGenerateSourcingArtifacts || canonical-admin fallback).

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import {
  XLSX_CONTENT_TYPE,
  hasXlsxComparison,
  renderArtifactXlsx,
} from '@/lib/source/exports';
import { buildPricingComparisonPayloadFromContext } from '@/lib/source/exports/payloads/pricing-comparison-payload';

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

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;

  if (!hasXlsxComparison(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `xlsx comparison rendering is not wired for ${artifactCode}.`,
      },
      { status: 404 },
    );
  }

  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: 'not_found', detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
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
        detail: 'Source artifact rights are required to export xlsx comparisons.',
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  let workbook;
  try {
    if (artifactCode === 'd19_pricing_workbook') {
      const payload = buildPricingComparisonPayloadFromContext(ctx, generatedAt);
      workbook = await renderArtifactXlsx({
        artifactCode,
        payload,
        variant: 'comparison',
      });
    } else {
      // Defensive — hasXlsxComparison should have caught this above.
      return Response.json(
        { error: 'unsupported_artifact', detail: artifactCode },
        { status: 404 },
      );
    }
  } catch (err) {
    console.error(
      '[GET /api/v1/source/:eventId/artifacts/:artifactCode/render-comparison-xlsx] renderer error',
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
  const filename = `${artifactCode}__comparison__${ctx.event.code}__${generatedAt.slice(0, 10)}.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': XLSX_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-artifact-variant': 'comparison',
      'x-source-event-code': ctx.event.code,
    },
  });
}
