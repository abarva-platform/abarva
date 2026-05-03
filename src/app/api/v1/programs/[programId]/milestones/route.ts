// GET  /api/v1/programs/:programId/milestones · list
// POST /api/v1/programs/:programId/milestones · create

import { NextRequest } from 'next/server';
import { getMilestones, getProgramById } from '@/lib/programs/queries';
import { createMilestone } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const milestones = await getMilestones(ctx, programId);
    return Response.json({ milestones });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/milestones]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      targetDate?: string;
      phaseNumber?: number;
      moduleKey?: string;
      ownerUserId?: string;
    };
    if (!body?.name) {
      return Response.json({ error: 'bad_request', detail: 'name required' }, { status: 400 });
    }
    const id = await createMilestone(ctx, programId, {
      name: body.name,
      description: body.description,
      targetDate: body.targetDate,
      phaseNumber: body.phaseNumber,
      moduleKey: body.moduleKey,
      ownerUserId: body.ownerUserId,
    }, { supabase });
    return Response.json({ milestoneId: id }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/milestones]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
