// POST /api/v1/programs/:programId/deliverables/:deliverableId/publish
// Draft → in_review. Any lead or approver can publish their own module's work.

import { publishDeliverable } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ programId: string; deliverableId: string }> }) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const published = await publishDeliverable(ctx, programId, deliverableId, { supabase });
    if (!published) return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json({ ok: true, deliverableId, status: 'in_review' });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/deliverables/:did/publish]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
