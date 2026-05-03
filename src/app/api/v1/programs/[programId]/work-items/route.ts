// GET /api/v1/programs/:programId/work-items · list
// POST /api/v1/programs/:programId/work-items · create

import { NextRequest } from 'next/server';
import { getProgramById, getWorkItems } from '@/lib/programs/queries';
import { createWorkItem } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import type { WorkItemType } from '@/lib/programs/types.db';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TYPES: WorkItemType[] = ['workstream', 'use_case', 'solution', 'execution_plan', 'task'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const items = await getWorkItems(ctx, programId);
    return Response.json({ workItems: items });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/work-items]', err);
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
      title?: string;
      description?: string;
      itemType?: WorkItemType;
      parentId?: string;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      assignedUserId?: string;
      moduleKey?: string;
      phaseNumber?: number;
      dueDate?: string;
    };
    if (!body?.title || !body?.itemType || !VALID_TYPES.includes(body.itemType)) {
      return Response.json({ error: 'bad_request', detail: 'title + itemType required' }, { status: 400 });
    }
    const id = await createWorkItem(ctx, programId, {
      title: body.title,
      description: body.description,
      itemType: body.itemType,
      parentId: body.parentId,
      priority: body.priority,
      assignedUserId: body.assignedUserId,
      moduleKey: body.moduleKey,
      phaseNumber: body.phaseNumber,
      dueDate: body.dueDate,
    }, { supabase });
    return Response.json({ workItemId: id }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/work-items]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
