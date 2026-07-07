// GET /api/v1/moves/audit-pack
//
// Wave 3 A1: authenticated, tenant-scoped per-Move audit pack. The route
// requires `?moveId=` and never falls back to another tenant's reference deck.
// If the Move is not in scope, it returns the same honest not-found response
// for missing and out-of-tenant Moves.

import type { NextRequest } from 'next/server';
import { pdf } from '@react-pdf/renderer';

import { getCurrentUser } from '@/lib/auth/current-user';
import { PDF_CONTENT_TYPE } from '@/lib/exports-shared/pdf-base';
import { loadMoveBusinessCaseInput } from '@/lib/programs/board-artifacts/load-move-business-case-input';
import {
  buildMoveAuditPackPdfElement,
  renderMoveAuditPackHtml,
} from '@/lib/programs/expert-kernel/exports/audit-pack';
import { cachedRender } from '@/lib/programs/expert-kernel/exports/board-grade/render-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function pdfBuffer(
  element: Parameters<typeof pdf>[0],
): Promise<Buffer> {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function GET(req: NextRequest): Promise<Response> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: 'unauthorized', detail: 'A signed-in session is required.' },
      { status: 401 },
    );
  }

  const params = new URL(req.url).searchParams;
  const moveId = params.get('moveId')?.trim() || '';
  if (!moveId) {
    return Response.json(
      { error: 'missing_move', detail: 'A moveId query parameter is required.' },
      { status: 400 },
    );
  }

  let moveInput: Awaited<ReturnType<typeof loadMoveBusinessCaseInput>>;
  try {
    moveInput = await loadMoveBusinessCaseInput(moveId);
  } catch (err) {
    console.error('[GET /api/v1/moves/audit-pack] move load error', {
      err,
      moveId,
    });
    moveInput = null;
  }

  if (!moveInput) {
    return Response.json(
      {
        error: 'not_found',
        detail: 'No such Move is available in your current client scope.',
      },
      { status: 404 },
    );
  }

  const generatedOn = new Date().toISOString().slice(0, 10);
  const format = params.get('format') === 'pdf' ? 'pdf' : 'html';
  const download = params.get('download') === '1';
  const filename = `move-audit-pack-${moveId}-${generatedOn}.${format}`;

  if (format === 'pdf') {
    try {
      const buffer = await pdfBuffer(
        buildMoveAuditPackPdfElement(moveInput, generatedOn),
      );
      return new Response(buffer as unknown as ArrayBuffer, {
        status: 200,
        headers: {
          'content-type': PDF_CONTENT_TYPE,
          'content-disposition': `attachment; filename="${filename}"`,
          'cache-control': 'no-store',
          'x-move-artifact': 'audit-pack',
          'x-move-artifact-format': 'pdf',
        },
      });
    } catch (err) {
      console.error('[GET /api/v1/moves/audit-pack] pdf render error', {
        err,
        moveId,
      });
      return Response.json(
        {
          error: 'render_failed',
          detail:
            err instanceof Error
              ? err.message
              : 'Move audit pack PDF render failed.',
        },
        { status: 500 },
      );
    }
  }

  let html: string;
  try {
    html = cachedRender(`move-audit-pack:html:${moveId}:${generatedOn}`, () =>
      renderMoveAuditPackHtml(moveInput!, generatedOn),
    );
  } catch (err) {
    console.error('[GET /api/v1/moves/audit-pack] html render error', {
      err,
      moveId,
    });
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error
            ? err.message
            : 'Move audit pack HTML render failed.',
      },
      { status: 500 },
    );
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-move-artifact': 'audit-pack',
      'x-move-artifact-format': 'html',
      ...(download
        ? { 'content-disposition': `attachment; filename="${filename}"` }
        : {}),
    },
  });
}
