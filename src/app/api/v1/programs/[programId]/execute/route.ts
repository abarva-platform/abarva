// GET /api/v1/programs/:programId/execute · aggregate rollup for Execute surface.
// Returns counts, at-risk milestones, blocked >=48h work items, risk heatmap.

import { getExecuteRollupWithClient } from '@/lib/programs/execute';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const rollup = await getExecuteRollupWithClient(ctx, programId, supabase);
    return Response.json({ rollup });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/execute]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
