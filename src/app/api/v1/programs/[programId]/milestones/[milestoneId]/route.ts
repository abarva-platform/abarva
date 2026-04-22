// PATCH /api/v1/programs/:programId/milestones/:milestoneId
// Body: { status: MilestoneStatus, actualDate?: string }

import { NextRequest } from 'next/server';
import { updateMilestoneStatus } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import type { MilestoneStatus } from '@/lib/programs/types.db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: MilestoneStatus[] = ['upcoming', 'at_risk', 'hit', 'missed', 'cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ programId: string; milestoneId: string }> }) {
  try {
    const { programId, milestoneId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as { status?: MilestoneStatus; actualDate?: string };
    if (!body?.status || !VALID.includes(body.status)) {
      return Response.json({ error: 'bad_request', detail: `status must be one of ${VALID.join(', ')}` }, { status: 400 });
    }
    await updateMilestoneStatus(ctx, programId, milestoneId, body.status, body.actualDate);
    return Response.json({ ok: true, milestoneId, status: body.status });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[PATCH /programs/:id/milestones/:mid]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
