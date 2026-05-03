// GET /api/v1/programs/:programId/flags · list open maestro oversight flags

import { NextRequest } from 'next/server';
import { getOpenMaestroFlags, getProgramById } from '@/lib/programs/queries';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const flags = await getOpenMaestroFlags(ctx, programId);
    return Response.json({ flags });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/flags]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
