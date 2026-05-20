// GET /api/v1/moves/board-grade-solution-architecture
//
// Streams the board-grade Solution Architecture Pack for the Apex "Contact
// Center AI Routing" Move as one self-contained HTML deck — the artifact
// called for by the Moves Board-Grade Artifact Blueprint (§7 / Appendix A.3).
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG architecture diagram, the slide-switch script inline,
// no external <script>, <link> or remote <img>. It opens offline and prints
// cleanly.
//
// Auth: a valid Clerk session, consistent with the other Moves Expert Kernel
// export routes. The content is the fixed Apex demo substrate — no per-tenant
// customer data — so a session is the gate.
//
// The renderer is deterministic and pure. Apex's honest architecture verdict
// is `conditional` — the target-state pattern is production-shaped on the §4
// reference architecture, but a transcript-privacy blocker and a CFO-
// monetisation blocker remain. That is a valid rendered outcome, never an
// error.

import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { renderApexSolutionArchitectureHtml } from '@/lib/programs/expert-kernel/exports/board-grade';
import { cachedRender } from '@/lib/programs/expert-kernel/exports/board-grade/render-cache';

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

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`solution-architecture:html:${generatedOn}`, () =>
      renderApexSolutionArchitectureHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      '[GET /api/v1/moves/board-grade-solution-architecture] render error',
      { err },
    );
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error
            ? err.message
            : 'Board-grade Solution Architecture Pack render failed.',
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = new URL(req.url).searchParams.get('download') === '1';
  const filename = `apex-solution-architecture-pack-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-kernel-move': 'apex:move:contact-center-ai-routing',
      'x-kernel-verdict': 'conditional',
      ...(download
        ? {
            'content-disposition': `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
