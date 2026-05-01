// POST /api/v1/programs/:programId/approvals/:approvalId/decide · approve or deny

import { NextRequest } from 'next/server';
import { decideApproval, hasAuthority } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string; approvalId: string }> }) {
  try {
    const { programId, approvalId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as { decision?: 'approved' | 'denied'; notes?: string };
    if (body?.decision !== 'approved' && body?.decision !== 'denied') {
      return Response.json({ error: 'bad_request', detail: 'decision must be approved|denied' }, { status: 400 });
    }

    // Enforce authority · only sponsors or founders can decide
    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (!accessPolicy.canApproveGates && ctx.role !== 'founder') {
      return Response.json({ error: 'forbidden', detail: 'phase-gate approval permission required' }, { status: 403 });
    }
    const sponsor = await hasAuthority(ctx, programId, 'sponsor');
    if (!sponsor && ctx.role !== 'founder') {
      return Response.json({ error: 'forbidden', detail: 'sponsor or founder authority required' }, { status: 403 });
    }

    await decideApproval(ctx, approvalId, body.decision, body.notes);
    return Response.json({ ok: true, approvalId, decision: body.decision });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/approvals/:aid/decide]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
