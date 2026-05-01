// PR-OV2-3c · Downloadable HTML primer export.
//
// GET /api/programs/:id/primer-html
//
// Returns the archetype primer for the program at this id as a complete,
// self-contained HTML document with `Content-Disposition: attachment` so
// the browser triggers a download. The endpoint is the second consumption
// mode of the same primer contract that powers the in-app Phase 0 section
// (OV2-3b · Phase0Primer.tsx).
//
// Auth: gated through `requireTenancy` (under src/app/api/v1/programs/_auth)
// so an unauthenticated caller gets a 401, matching every other tenant-
// scoped programs API on this surface.
//
// Pattern resolution (per the OV2-3b precedent in
// src/app/programs/[id]/page.tsx):
//   1. Resolve via APEX_RETAIL_PROGRAM_INSTANCES — same fixture lookup
//      every other pattern-driven panel on this page uses today.
//   2. If the program is not in the fixture set we fall through to the
//      DB engagement record (validates the id exists and the user has
//      access). Even then we still need a patternId to render — when
//      none is found we 404 with a clear `error: "no_primer"` body.

import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getArchetypePrimer } from '@/lib/programs/archetype-primers';
import { renderArchetypePrimerHtml } from '@/lib/programs/archetype-primers/render-html';
import { getEngagementWithPhaseData } from '@/lib/programs/db-phase-queries';
import { getActiveClientRow } from '@/lib/active-client';
import {
  requireTenancy,
  tenancyErrorResponse,
} from '@/app/api/v1/programs/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let programId: string;
  let tenancy: Awaited<ReturnType<typeof requireTenancy>> | null = null;
  try {
    const resolved = await params;
    programId = resolved.id;
    // Auth gate — 401 if no person, 403 if no client.
    tenancy = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      console.error('[GET /api/programs/:id/primer-html] auth error', err);
      return jsonError('internal_error', 500);
    }
  }

  // ── Pattern resolution ────────────────────────────────────────────────
  // Prefer the in-memory fixture (same precedence the program-detail page
  // uses for every other pattern-keyed panel). Falls through to the DB
  // engagement record so the call still validates the program's existence
  // when it isn't in the fixture set.
  const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) =>
      i.id.toLowerCase() === programId.toLowerCase() ||
      i.displayId.toLowerCase() === programId.toLowerCase(),
  );

  const patternId: string | null = instance?.patternId ?? null;

  if (!patternId) {
    // Validate the program exists in the DB even when the primer can't
    // be resolved — keeps the 404/no-primer signal honest.
    let dbExists = false;
    try {
      const clientRow = await getActiveClientRow().catch(() => null);
      const db = await getEngagementWithPhaseData(programId, clientRow?.id ?? null, tenancy);
      dbExists = db?.engagement != null;
    } catch {
      dbExists = false;
    }
    if (!dbExists) {
      return jsonError('program_not_found', 404);
    }
    return jsonError('no_primer', 404);
  }

  const primer = getArchetypePrimer(patternId);
  if (!primer) {
    return jsonError('no_primer', 404);
  }

  const html = renderArchetypePrimerHtml(primer);

  // Sanitize the filename a touch — only path-safe ASCII per RFC 6266 fallback.
  const safeId = programId.replace(/[^A-Za-z0-9_.-]+/g, '-');
  const filename = `${safeId}-phase0-primer.html`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=0',
    },
  });
}
