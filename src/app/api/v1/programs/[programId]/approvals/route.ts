// GET /api/v1/programs/:programId/approvals · list pending approvals
// POST /api/v1/programs/:programId/approvals · create new approval request

import { NextRequest } from 'next/server';
import { getPendingApprovals, getProgramById } from '@/lib/programs/queries';
import { requestFounderApproval } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import { canReadProgram, loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import type { ApprovalAuthority, FounderApprovalRequestRow } from '@/lib/programs/types.db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    if (!(await canReadProgram(ctx, programId))) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    const approvals = await getPendingApprovals(ctx, programId, { supabase });
    return Response.json({ approvals });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/approvals]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (accessPolicy.programIdsAllowed !== null && !accessPolicy.programIdsAllowed.includes(programId)) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    const body = (await req.json()) as {
      requestType?: FounderApprovalRequestRow['requestType'];
      headline?: string;
      context?: Record<string, unknown>;
      approverUserId?: string;
      approverRole?: ApprovalAuthority;
      deadlineHours?: number;
    };
    if (!body?.requestType || !body?.headline) {
      return Response.json({ error: 'bad_request', detail: 'requestType + headline required' }, { status: 400 });
    }
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const approvalId = await requestFounderApproval(ctx, programId, {
      requestType: body.requestType,
      headline: body.headline,
      context: body.context,
      approverUserId: body.approverUserId,
      approverRole: body.approverRole,
      deadlineHours: body.deadlineHours,
    }, { supabase });
    return Response.json({ approvalId }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/approvals]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
