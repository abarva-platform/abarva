// POST /api/v1/programs/:programId/flags/:flagId/resolve
// Body: { resolutionNotes: string }

import { NextRequest } from 'next/server';
import { resolveMaestroFlag } from '@/lib/programs/governance';
import { getProgramById } from '@/lib/programs/queries';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string; flagId: string }> }) {
  try {
    const { programId, flagId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    const body = (await req.json()) as { resolutionNotes?: string };
    if (!body?.resolutionNotes) {
      return Response.json({ error: 'bad_request', detail: 'resolutionNotes required' }, { status: 400 });
    }
    const resolved = await resolveMaestroFlag(ctx, programId, flagId, body.resolutionNotes);
    if (!resolved) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    return Response.json({ ok: true, flagId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/flags/:fid/resolve]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
