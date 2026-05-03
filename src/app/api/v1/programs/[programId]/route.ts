// GET /api/v1/programs/:programId · single program full state
// Returns ProgramFullState (view-model type from types.ts).

import { getProgramById } from '@/lib/programs/queries';
import { buildProgramFullState } from '@/lib/programs/transformers';
import { requireTenancy, tenancyErrorResponse } from '../_auth';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { supabase } = await getProgramsRouteSupabase('detail');
    const { programId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: 'archived_or_deleted' }, { status: 410 });
    }
    const fullState = await buildProgramFullState(ctx, program);
    return Response.json({ program: fullState });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /api/v1/programs/:programId]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
