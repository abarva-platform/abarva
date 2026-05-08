// GET /api/v1/source/:eventId/artifacts/:artifactCode/render?format=...&variant=...
//
// Unified Source artifact render route (Slice 8.4). Replaces the four
// per-format routes (render-xlsx, render-docx, render-html, render-pdf)
// + render-comparison-xlsx with a single endpoint that takes the
// requested format as a query parameter and routes through the
// SourceDeliverableSpec dispatcher.
//
// Query params:
//   - format=xlsx|docx|html|pdf  (optional — falls back to the kind's
//                                  default per format-router.ts)
//   - variant=template|comparison (optional — for d19; default template)
//
// Response shape:
//   200 with the rendered bytes + content-type matching the format,
//   plus audit headers (x-source-artifact-code / x-source-event-code /
//   x-source-artifact-format / x-source-artifact-variant).
//
// The legacy per-format routes still work in parallel during the
// transition; Slice 8.5 deletes them once canvas anchors point here.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';

import { renderSourceDeliverable } from '@/lib/source/exports/dispatch';
import { buildSourceDeliverableSpec, kindForArtifactCode } from '@/lib/source/exports/spec-builder';
import type { DeliverableFormat } from '@/lib/programs/exports/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const VALID_FORMATS: ReadonlySet<string> = new Set(['xlsx', 'docx', 'html', 'pdf']);
const VALID_VARIANTS: ReadonlySet<string> = new Set(['template', 'comparison']);

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
  const url = new URL(req.url);
  const formatParam = url.searchParams.get('format');
  const variantParam = url.searchParams.get('variant') ?? undefined;

  // Validate format param.
  let requestedFormat: DeliverableFormat | undefined;
  if (formatParam) {
    if (!VALID_FORMATS.has(formatParam)) {
      return Response.json(
        {
          error: 'invalid_format',
          detail: `Format "${formatParam}" is not one of: xlsx, docx, html, pdf.`,
        },
        { status: 400 },
      );
    }
    requestedFormat = formatParam as DeliverableFormat;
  }

  // Validate variant param.
  if (variantParam && !VALID_VARIANTS.has(variantParam)) {
    return Response.json(
      {
        error: 'invalid_variant',
        detail: `Variant "${variantParam}" is not one of: template, comparison.`,
      },
      { status: 400 },
    );
  }

  // Resolve artifact code → kind.
  const kind = kindForArtifactCode(
    artifactCode,
    variantParam === 'comparison' ? 'comparison' : 'template',
  );
  if (!kind) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `No SourceDeliverableKind wired for artifact code "${artifactCode}".`,
      },
      { status: 404 },
    );
  }

  // Resolve event context.
  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: 'not_found', detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  // Auth gate (same as legacy routes).
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
        detail: 'Source artifact rights are required to export documents.',
      },
      { status: 403 },
    );
  }

  // Build spec + render.
  const generatedAt = new Date().toISOString();
  let result;
  try {
    const spec = await buildSourceDeliverableSpec(ctx, kind, generatedAt);
    result = await renderSourceDeliverable(spec, requestedFormat);
  } catch (err) {
    console.error(
      '[GET /api/v1/source/:eventId/artifacts/:artifactCode/render] renderer error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'render failed',
      },
      { status: 500 },
    );
  }

  // HTML responses render in the browser; everything else downloads.
  const dispositionHeader: Record<string, string> =
    result.format === 'html'
      ? {}
      : { 'content-disposition': `attachment; filename="${result.filename}"` };

  return new Response(result.buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': result.contentType,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': ctx.event.code,
      'x-source-artifact-format': result.format,
      'x-source-artifact-kind': kind,
      ...(variantParam ? { 'x-source-artifact-variant': variantParam } : {}),
      ...dispositionHeader,
    },
  });
}
