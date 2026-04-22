// PATCH /api/v1/programs/:programId/work-items/:workItemId
// Body: { status?: WorkItemStatus, block?: { reason: string }, markNexusDrafted?: boolean }
// Handles status transitions, blocked-state metadata, and Nexus-attribution flag.

import { NextRequest } from 'next/server';
import { updateWorkItemStatus } from '@/lib/programs/mutations';
import { blockWorkItem, markWorkItemNexusDrafted } from '@/lib/programs/execute';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import type { WorkItemStatus } from '@/lib/programs/types.db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: WorkItemStatus[] = ['open', 'in_progress', 'blocked', 'done', 'cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ programId: string; workItemId: string }> }) {
  try {
    const { programId, workItemId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as {
      status?: WorkItemStatus;
      block?: { reason: string };
      markNexusDrafted?: boolean;
      draftContext?: Record<string, unknown>;
    };

    if (body?.block) {
      await blockWorkItem(ctx, programId, workItemId, body.block.reason);
    }
    if (body?.markNexusDrafted) {
      await markWorkItemNexusDrafted(ctx, programId, workItemId, body.draftContext);
    }
    if (body?.status) {
      if (!VALID.includes(body.status)) {
        return Response.json({ error: 'bad_request', detail: `status must be one of ${VALID.join(', ')}` }, { status: 400 });
      }
      await updateWorkItemStatus(ctx, programId, workItemId, body.status);
    }
    if (!body?.status && !body?.block && !body?.markNexusDrafted) {
      return Response.json({ error: 'bad_request', detail: 'nothing to update' }, { status: 400 });
    }
    return Response.json({ ok: true, workItemId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[PATCH /programs/:id/work-items/:wid]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
