// GET /api/v1/intelligence/brief/render-pdf
//
// Gap G9: PDF companion to render-docx. Returns a CFO-readable one-pager
// Intelligence brief — same real per-tenant payload, print-ready format.
//
// Grounding (no fabrication — see PR #2143): Apex Retail's brief carries
// the seeded corpus content plus ai_initiatives portfolio; Meridian /
// First Capital export only the ai_initiatives portfolio and an honest
// "corpus not yet seeded" disclosure.
//
// Strategy: try the full body render; if @react-pdf throws on a
// structurally-complex body, fall back to a degraded cover-only render
// so the user always gets a usable PDF.

import type { NextRequest } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import {
  PDF_CONTENT_TYPE,
  buildIntelligenceBriefPayloadForActiveTenant,
  renderIntelligenceBriefPdf,
  type IntelligenceBriefPayload,
} from '@/lib/intelligence/exports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const requestedClient = req.nextUrl.searchParams.get('client');
  const generatedAt = new Date().toISOString();

  let payload: IntelligenceBriefPayload;
  try {
    payload = await buildIntelligenceBriefPayloadForActiveTenant(
      requestedClient,
      generatedAt,
    );
  } catch (err) {
    console.error(
      '[GET /api/v1/intelligence/brief/render-pdf] payload error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'brief payload failed',
      },
      { status: 500 },
    );
  }

  const renderToBuffer = async (degraded: boolean): Promise<Buffer> => {
    const element = renderIntelligenceBriefPdf(payload, { degraded });
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
      { error: err instanceof Error ? err.message : String(err) },
    );
    try {
      buffer = await renderToBuffer(true);
      degraded = true;
    } catch (fallbackErr) {
      console.error('[render-pdf] degraded fallback also threw', fallbackErr);
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

  const filename = `intelligence-brief__${payload.filenameSlug}__${generatedAt.slice(0, 10)}.pdf`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': PDF_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-intelligence-artifact': 'cxo-brief',
      'x-intelligence-artifact-format': 'pdf',
      ...(degraded ? { 'x-intelligence-pdf-degraded': 'true' } : {}),
    },
  });
}
