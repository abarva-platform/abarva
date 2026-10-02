// GET returns historical role-specific rows for audit context only. Moves
// approval is the single authorized workspace-user deliverable sign-off.
//
// POST is retired: Moves has one authorized workspace-user approval, not
// separate business, technology, finance, or risk sign-off actors.

import { getRoleApprovalSummary } from '@/lib/programs/deliverable-role-approvals';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadDeliverableTypeKey(
  supabase: Awaited<ReturnType<typeof getProgramsRouteSupabase>>['supabase'],
  programId: string,
  deliverableId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('deliverables_v2')
    .select('deliverable_type_key')
    .eq('id', deliverableId)
    .eq('engagement_id', programId)
    .maybeSingle();
  if (error) throw error;
  return (
    (data as { deliverable_type_key: string } | null)?.deliverable_type_key ??
    null
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ programId: string; deliverableId: string }> },
) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const deliverableTypeKey = await loadDeliverableTypeKey(
      supabase,
      programId,
      deliverableId,
    );
    if (!deliverableTypeKey)
      return Response.json({ error: 'not_found' }, { status: 404 });

    const summary = await getRoleApprovalSummary(
      ctx,
      programId,
      deliverableId,
      deliverableTypeKey,
      {
        supabase,
      },
    );
    return Response.json({ ok: true, ...summary });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[GET /programs/:id/deliverables/:did/role-approvals]', err);
    return Response.json(
      { error: 'internal_error', message: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ programId: string; deliverableId: string }> },
) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const deliverableTypeKey = await loadDeliverableTypeKey(
      supabase,
      programId,
      deliverableId,
    );
    if (!deliverableTypeKey)
      return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json(
      {
        error: 'role_approvals_retired',
        detail:
          'Moves records approvals from one authorized workspace user. Capture stakeholder comments as review feedback; use the deliverable sign-off action for approval.',
      },
      { status: 410 },
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[POST /programs/:id/deliverables/:did/role-approvals]', err);
    return Response.json(
      { error: 'internal_error', message: (err as Error).message },
      { status: 500 },
    );
  }
}
