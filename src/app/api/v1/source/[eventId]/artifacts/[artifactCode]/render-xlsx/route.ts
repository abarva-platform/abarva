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

  if (!isXlsxGeneratable(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `xlsx generation is not yet wired for ${artifactCode}.`,
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
        detail: 'Source artifact rights are required to export xlsx templates.',
      },
      { status: 403 },
    );
  }

  // Build payload + render workbook.
  const generatedAt = new Date().toISOString();
  let workbook;
  try {
    if (artifactCode === 'd19_pricing_workbook') {
      const payload = buildPricingTemplatePayloadFromContext(ctx, generatedAt);
      workbook = await renderArtifactXlsx({ artifactCode, payload });
    } else {
      // Defensive — isXlsxGeneratable should have caught this above.
      return Response.json(
        { error: 'unsupported_artifact', detail: artifactCode },
        { status: 404 },
      );
    }
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
  const filename = `${artifactCode}__${ctx.event.code}__${generatedAt.slice(0, 10)}.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': XLSX_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': ctx.event.code,
    },
  });
}
