// GET  /api/v1/programs/:programId/risks · list
// POST /api/v1/programs/:programId/risks · create

import { NextRequest } from 'next/server';
import { getRisks } from '@/lib/programs/queries';
import { createRisk } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import type { RiskImpact, RiskLikelihood } from '@/lib/programs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_LIKE: RiskLikelihood[] = ['low', 'medium', 'high'];
const VALID_IMPACT: RiskImpact[] = ['low', 'medium', 'high'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const risks = await getRisks(ctx, programId);
    return Response.json({ risks });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/risks]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as {
      title?: string;
      description?: string;
      likelihood?: RiskLikelihood;
      impact?: RiskImpact;
      mitigationPlan?: string;
      ownerUserId?: string;
      phaseNumber?: number;
      moduleKey?: string;
    };
    if (!body?.title) {
      return Response.json({ error: 'bad_request', detail: 'title required' }, { status: 400 });
    }
    if (body.likelihood && !VALID_LIKE.includes(body.likelihood)) {
      return Response.json({ error: 'bad_request', detail: 'likelihood must be low|medium|high' }, { status: 400 });
    }
    if (body.impact && !VALID_IMPACT.includes(body.impact)) {
      return Response.json({ error: 'bad_request', detail: 'impact must be low|medium|high' }, { status: 400 });
    }
    const id = await createRisk(ctx, programId, {
      title: body.title,
      description: body.description,
      likelihood: body.likelihood,
      impact: body.impact,
      mitigationPlan: body.mitigationPlan,
      ownerUserId: body.ownerUserId,
      phaseNumber: body.phaseNumber,
      moduleKey: body.moduleKey,
    });
    return Response.json({ riskId: id }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/risks]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
