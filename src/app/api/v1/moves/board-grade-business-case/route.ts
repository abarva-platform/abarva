// GET /api/v1/moves/board-grade-business-case
//
// Streams the board-grade Costed Business-Case Pack for the Apex "Contact
// Center AI Routing" Move — the reference artifact called for by the Moves
// Board-Grade Artifact Blueprint (§9 / §13).
//
// Two representations of the SAME pack are served from one route:
//   • Default — a single self-contained HTML deck: all CSS inlined, every
//     exhibit an inline SVG, no external assets. Opens offline, prints clean.
//     `?download=1` serves it as a file attachment.
//   • `?format=pptx` — an editable 16:9 PowerPoint. The words are native,
//     editable PowerPoint objects; the bespoke exhibits embed as high-res
//     images. Always served as a `.pptx` file attachment.
//
// Auth: a valid Clerk session, consistent with the other Moves Expert Kernel
// export routes. The content is the fixed Apex demo substrate — no per-tenant
// customer data — so a session is the gate.
//
// The renderers are deterministic and pure. Apex's honest verdict is `shape`
// with a blocked payback; that is a valid rendered outcome, never an error.

import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import {
  renderApexCostedBusinessCaseHtml,
  renderApexCostedBusinessCasePptx,
} from '@/lib/programs/expert-kernel/exports/board-grade';
import {
  cachedRender,
  cachedRenderAsync,
} from '@/lib/programs/expert-kernel/exports/board-grade/render-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest): Promise<Response> {
  // --- Auth — a valid session. -------------------------------------------
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: 'unauthorized', detail: 'A signed-in session is required.' },
      { status: 401 },
    );
  }

  const generatedOn = new Date().toISOString().slice(0, 10);
  const params = new URL(req.url).searchParams;

  // `?format=pptx` serves the editable PowerPoint; anything else is the HTML
  // deck. The PowerPoint renderer is async (it rasterises the SVG exhibits).
  if (params.get('format') === 'pptx') {
    let pptx: Buffer;
    try {
      // Pure, date-keyed renderer — memoised per day. The cache key includes
      // the artifact id, the `pptx` format, and `generatedOn`, so a date
      // rollover produces a fresh entry. Only a successful render is cached.
      pptx = await cachedRenderAsync(
        `costed-business-case:pptx:${generatedOn}`,
        () => renderApexCostedBusinessCasePptx(generatedOn),
      );
    } catch (err) {
      console.error(
        '[GET /api/v1/moves/board-grade-business-case] pptx render error',
        { err },
      );
      return Response.json(
        {
          error: 'render_failed',
          detail:
            err instanceof Error
              ? err.message
              : 'Board-grade business-case PowerPoint render failed.',
        },
        { status: 500 },
      );
    }
    const pptxName = `apex-costed-business-case-pack-${generatedOn}.pptx`;
    return new Response(new Uint8Array(pptx), {
      status: 200,
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'content-disposition': `attachment; filename="${pptxName}"`,
        'cache-control': 'no-store',
        'x-kernel-move': 'apex:move:contact-center-ai-routing',
        'x-kernel-verdict': 'shape',
      },
    });
  }

  // The HTML renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`costed-business-case:html:${generatedOn}`, () =>
      renderApexCostedBusinessCaseHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      '[GET /api/v1/moves/board-grade-business-case] render error',
      { err },
    );
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error
            ? err.message
            : 'Board-grade business-case render failed.',
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get('download') === '1';
  const filename = `apex-costed-business-case-pack-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-kernel-move': 'apex:move:contact-center-ai-routing',
      'x-kernel-verdict': 'shape',
      ...(download
        ? {
            'content-disposition': `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
