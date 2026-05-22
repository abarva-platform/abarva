// GET /api/v1/moves/board-grade-discover-brief
//
// Streams the board-grade Discover Brief for the Apex "Contact Center AI
// Routing" Move as one self-contained HTML deck — the artifact called for by
// the Moves Board-Grade Artifact Blueprint (§5 / Appendix A.1).
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG, the slide-switch script inline, no external <script>,
// <link> or remote <img>. It opens offline and prints cleanly.
//
// Auth: a valid Clerk session, consistent with the other Moves Expert Kernel
// export routes. The content is the fixed Apex demo substrate — no per-tenant
// customer data — so a session is the gate.
//
// The renderer is deterministic and pure. Apex's honest Discover verdict is
// `reshape` with a directional-only opportunity; that is a valid rendered
// outcome, never an error.

import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { renderApexDiscoverBriefHtml } from '@/lib/programs/expert-kernel/exports/board-grade';
import { cachedRender } from '@/lib/programs/expert-kernel/exports/board-grade/render-cache';
import { assertBoardGradeTenancy } from '@/lib/programs/board-artifacts/board-grade-route-guard';

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

  // --- Tenancy — the artifact is Apex-owned; block cross-tenant access. ---
  const tenancyDenied = await assertBoardGradeTenancy(
    'GET /api/v1/moves/board-grade-discover-brief',
  );
  if (tenancyDenied) return tenancyDenied;

  const generatedOn = new Date().toISOString().slice(0, 10);

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`discover-brief:html:${generatedOn}`, () =>
      renderApexDiscoverBriefHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      '[GET /api/v1/moves/board-grade-discover-brief] render error',
      { err },
    );
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error
            ? err.message
            : 'Board-grade Discover Brief render failed.',
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = new URL(req.url).searchParams.get('download') === '1';
  const filename = `apex-discover-brief-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-kernel-move': 'apex:move:contact-center-ai-routing',
      'x-kernel-verdict': 'reshape',
      ...(download
        ? {
            'content-disposition': `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
