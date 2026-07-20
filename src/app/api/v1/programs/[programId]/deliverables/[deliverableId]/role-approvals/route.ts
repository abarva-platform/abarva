// GET  /api/v1/programs/:programId/deliverables/:deliverableId/role-approvals
//   Read the per-role (business/technology/finance/risk_security) approval
//   status for a deliverable. Only roles required by the deliverable's TYPE
//   (see REQUIRED_APPROVAL_ROLES) are meaningful; a type with no required
//   roles returns an empty required set (the existing single-actor sign-off
//   remains the only gate for it).
//
// POST /api/v1/programs/:programId/deliverables/:deliverableId/role-approvals
//   Record (upsert) one role's decision: { role, status, approverName?,
//   outstandingConditions? }. Requires approver authority or higher, same bar
//   as the existing sign-off route.

import {
  getRoleApprovalSummary,
  recordRoleApprovalDecision,
  type ApprovalRole,
  type RoleApprovalStatus,
} from '@/lib/programs/deliverable-role-approvals';
import { hasAuthority } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES: ApprovalRole[] = ['business', 'technology', 'finance', 'risk_security'];
const VALID_STATUSES: RoleApprovalStatus[] = ['pending', 'reviewed', 'approved', 'rejected'];

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
  return (data as { deliverable_type_key: string } | null)?.deliverable_type_key ?? null;
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

    const deliverableTypeKey = await loadDeliverableTypeKey(supabase, programId, deliverableId);
    if (!deliverableTypeKey) return Response.json({ error: 'not_found' }, { status: 404 });

    const summary = await getRoleApprovalSummary(ctx, programId, deliverableId, deliverableTypeKey, {
      supabase,
    });
    return Response.json({ ok: true, ...summary });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[GET /programs/:id/deliverables/:did/role-approvals]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string; deliverableId: string }> },
) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const canApprove =
      (await hasAuthority(ctx, programId, 'approver', { supabase })) ||
      ctx.role === 'founder' ||
      ctx.role === 'maestro';
    if (!canApprove) {
      return Response.json(
        { error: 'forbidden', detail: 'approver authority or higher required' },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { role?: string; status?: string; approverName?: string; outstandingConditions?: string }
      | null;
    if (!body?.role || !VALID_ROLES.includes(body.role as ApprovalRole)) {
      return Response.json(
        { error: 'invalid_role', detail: `role must be one of ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      );
    }
    if (!body.status || !VALID_STATUSES.includes(body.status as RoleApprovalStatus)) {
      return Response.json(
        { error: 'invalid_status', detail: `status must be one of ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const record = await recordRoleApprovalDecision(
      ctx,
      programId,
      deliverableId,
      {
        role: body.role as ApprovalRole,
        status: body.status as RoleApprovalStatus,
        approverName: body.approverName,
        outstandingConditions: body.outstandingConditions,
      },
      { supabase },
    );
    return Response.json({ ok: true, record });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[POST /programs/:id/deliverables/:did/role-approvals]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
