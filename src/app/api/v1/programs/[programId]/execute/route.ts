// GET /api/v1/programs/:programId/execute · aggregate rollup for Execute surface.
// Returns counts, at-risk milestones, blocked >=48h work items, risk heatmap.

import { getExecuteRollup } from '@/lib/programs/execute';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const rollup = await getExecuteRollup(ctx, programId);
    return Response.json({ rollup });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/execute]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
