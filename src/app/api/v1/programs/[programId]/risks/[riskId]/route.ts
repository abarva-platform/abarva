// PATCH /api/v1/programs/:programId/risks/:riskId
// Body: { status?: RiskStatus, likelihood?, impact?, mitigationPlan? }

import { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import type { RiskImpact, RiskLikelihood, RiskStatus } from '@/lib/programs/types.db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUS: RiskStatus[] = ['open', 'mitigating', 'accepted', 'transferred', 'closed'];
const VALID_LIKE: RiskLikelihood[] = ['low', 'medium', 'high'];
const VALID_IMPACT: RiskImpact[] = ['low', 'medium', 'high'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ programId: string; riskId: string }> }) {
  try {
    const { programId, riskId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const body = (await req.json()) as {
      status?: RiskStatus;
      likelihood?: RiskLikelihood;
      impact?: RiskImpact;
      mitigationPlan?: string;
    };

    const update: Record<string, unknown> = {};
    if (body.status) {
      if (!VALID_STATUS.includes(body.status)) {
        return Response.json({ error: 'bad_request', detail: `status must be one of ${VALID_STATUS.join(', ')}` }, { status: 400 });
      }
      update.status = body.status;
      if (body.status === 'closed') update.closed_at = new Date().toISOString();
    }
    if (body.likelihood) {
      if (!VALID_LIKE.includes(body.likelihood)) {
        return Response.json({ error: 'bad_request', detail: 'likelihood low|medium|high' }, { status: 400 });
      }
      update.likelihood = body.likelihood;
    }
    if (body.impact) {
      if (!VALID_IMPACT.includes(body.impact)) {
        return Response.json({ error: 'bad_request', detail: 'impact low|medium|high' }, { status: 400 });
      }
      update.impact = body.impact;
    }
    if (typeof body.mitigationPlan === 'string') update.mitigation_plan = body.mitigationPlan;

    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'bad_request', detail: 'nothing to update' }, { status: 400 });
    }

    const sb = getServerSupabase();
    const { error } = await sb.from('program_risks').update(update).eq('id', riskId).eq('engagement_id', programId);
    if (error) throw error;
    return Response.json({ ok: true, riskId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[PATCH /programs/:id/risks/:rid]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
