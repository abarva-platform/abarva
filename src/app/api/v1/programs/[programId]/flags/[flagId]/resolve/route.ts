// POST /api/v1/programs/:programId/flags/:flagId/resolve
// Body: { resolutionNotes: string }

import { NextRequest } from 'next/server';
import { resolveMaestroFlag } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string; flagId: string }> }) {
  try {
    const { flagId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as { resolutionNotes?: string };
    if (!body?.resolutionNotes) {
      return Response.json({ error: 'bad_request', detail: 'resolutionNotes required' }, { status: 400 });
    }
    await resolveMaestroFlag(ctx, flagId, body.resolutionNotes);
    return Response.json({ ok: true, flagId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/flags/:fid/resolve]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
