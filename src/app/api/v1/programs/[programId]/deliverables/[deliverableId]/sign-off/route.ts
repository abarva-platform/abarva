// POST /api/v1/programs/:programId/deliverables/:deliverableId/sign-off
// in_review → signed_off. Requires sponsor or approver authority per Packet 4 matrix.

import { signOffDeliverable } from '@/lib/programs/mutations';
import { hasAuthority } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ programId: string; deliverableId: string }> }) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();

    const canApprove = (await hasAuthority(ctx, programId, 'approver')) || ctx.role === 'founder' || ctx.role === 'maestro';
    if (!canApprove) {
      return Response.json({ error: 'forbidden', detail: 'approver authority or higher required' }, { status: 403 });
    }

    await signOffDeliverable(ctx, programId, deliverableId);
    return Response.json({ ok: true, deliverableId, status: 'signed_off', signedOffBy: ctx.userId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/deliverables/:did/sign-off]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
