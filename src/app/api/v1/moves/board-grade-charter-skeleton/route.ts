// GET /api/v1/moves/board-grade-charter-skeleton
//
// Streams the board-grade Charter Business-Case Skeleton for the Apex "Contact
// Center AI Routing" Move as one self-contained HTML deck — the artifact
// called for by the Moves Board-Grade Artifact Blueprint (§6 / Appendix A.2).
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG, the slide-switch script inline, no external <script>,
// <link> or remote <img>. It opens offline and prints cleanly.
//
// Auth: a valid Clerk session, consistent with the other Moves Expert Kernel
// export routes. The content is the fixed Apex demo substrate — no per-tenant
// customer data — so a session is the gate.
//
// The renderer is deterministic and pure. Apex's honest Charter verdict is
// `shape` — fund shaping only, build funding blocked by a critic blocker;
// that is a valid rendered outcome, never an error.

import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { renderApexCharterSkeletonHtml } from '@/lib/programs/expert-kernel/exports/board-grade';

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
  let html: string;
  try {
    html = renderApexCharterSkeletonHtml(generatedOn);
  } catch (err) {
    console.error(
      '[GET /api/v1/moves/board-grade-charter-skeleton] render error',
      { err },
    );
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error
            ? err.message
            : 'Board-grade Charter Skeleton render failed.',
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = new URL(req.url).searchParams.get('download') === '1';
  const filename = `apex-charter-skeleton-${generatedOn}.html`;

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
