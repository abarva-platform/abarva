// GET /api/v1/programs/:programId/approvals · list pending approvals
// POST /api/v1/programs/:programId/approvals · create new approval request

import { NextRequest } from 'next/server';
import { getPendingApprovals, getProgramById } from '@/lib/programs/queries';
import { requestFounderApproval } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import type { ApprovalAuthority, FounderApprovalRequestRow } from '@/lib/programs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const approvals = await getPendingApprovals(ctx, programId);
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
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const approvalId = await requestFounderApproval(ctx, programId, {
      requestType: body.requestType,
      headline: body.headline,
      context: body.context,
      approverUserId: body.approverUserId,
      approverRole: body.approverRole,
      deadlineHours: body.deadlineHours,
    });
    return Response.json({ approvalId }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/approvals]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
