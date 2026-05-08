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

import type { NextRequest } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import {
  PDF_CONTENT_TYPE,
  isPdfGeneratable,
  renderArtifactPdf,
} from '@/lib/source/exports';
import { buildNarrativeDocxPayloadFromContext } from '@/lib/source/exports/payloads/narrative-docx-payload';
import {
  DECISION_BRIEF_PDF_CONFIG,
  RFP_PACK_PDF_CONFIG,
  SCOPE_MEMO_PDF_CONFIG,
  SELECTION_MEMO_PDF_CONFIG,
  buildNarrativePdf,
} from '@/lib/source/exports/renderers/narrative-pdf';

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

  if (!isPdfGeneratable(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `PDF generation is not yet wired for ${artifactCode}.`,
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
        detail: 'Source artifact rights are required to export PDF documents.',
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  const payload = buildNarrativeDocxPayloadFromContext(
    ctx,
    artifactCode,
    generatedAt,
  );

  // Strategy: try the full body render first. If @react-pdf throws —
  // typically pdfkit's "unsupported number" float-overflow on long /
  // structurally-complex bodies — fall back to a degraded cover-only
  // render with a notice pointing the user at docx + html for the full
  // content. The buyer always gets a PDF; quality degrades gracefully.
  const renderToBuffer = async (degraded: boolean): Promise<Buffer> => {
    const element = degraded
      ? buildNarrativePdf(payload, configForCode(artifactCode), { degraded: true })
      : renderArtifactPdf({ artifactCode, payload });
    const stream = await pdf(element).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  };

  let buffer: Buffer;
  let degraded = false;
  try {
    buffer = await renderToBuffer(false);
  } catch (err) {
    console.warn(
      '[render-pdf] full-body render threw; falling back to degraded cover-only',
      { artifactCode, error: err instanceof Error ? err.message : String(err) },
    );
    try {
      buffer = await renderToBuffer(true);
      degraded = true;
    } catch (fallbackErr) {
      console.error(
        '[render-pdf] degraded cover-only fallback also threw',
        fallbackErr,
      );
      return Response.json(
        {
          error: 'render_failed',
          detail:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : 'PDF renderer failed',
        },
        { status: 500 },
      );
    }
  }

  const filename = `${artifactCode}__${ctx.event.code}__${generatedAt.slice(0, 10)}.pdf`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': PDF_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': ctx.event.code,
      'x-source-artifact-format': 'pdf',
      ...(degraded ? { 'x-source-pdf-degraded': 'true' } : {}),
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
    case 'd05_scope_memo':
      return SCOPE_MEMO_PDF_CONFIG;
    case 'd09_rfp_pack':
      return RFP_PACK_PDF_CONFIG;
    case 'd24_decision_brief':
      return DECISION_BRIEF_PDF_CONFIG;
    case 'd27_selection_memo':
      return SELECTION_MEMO_PDF_CONFIG;
    default:
      throw new Error(`No PDF config for ${artifactCode}`);
  }
}
