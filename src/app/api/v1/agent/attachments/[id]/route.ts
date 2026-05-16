// /api/v1/agent/attachments/[id] · DELETE
//
// Soft-deletes an agent attachment row by stamping `deleted_at`. Does
// NOT remove the storage blob — that's deferred to a retention job so
// we can restore from accidental deletes during the pilot phase.
//
// Spec: this PR · feat(agent): shared AgentDock with 5 modes + Claude-
// style upload (foundation).

import { currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { selectAttachmentsWriteAdapter } from '@/lib/data-plane/write-adapters/attachmentsWriteAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = await currentUser().catch(() => null);
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const activeClient = await getActiveClientRow(null);
  if (!activeClient) {
    return Response.json({ error: 'tenant_not_resolved' }, { status: 404 });
  }

  // Soft-delete routed through the data-plane write seam (Slice 3c). The
  // tenant scoping + already-deleted guard are preserved in the adapter.
  // Default plane = Supabase — behavior is unchanged.
  let deleted: { id: string } | null;
  try {
    deleted = await selectAttachmentsWriteAdapter().softDeleteAgentAttachment(
      id,
      activeClient.id,
    );
  } catch (err) {
    return Response.json(
      {
        error: 'persist_failed',
        detail: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    );
  }
  if (!deleted) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  return Response.json({ id: deleted.id, deleted: true }, { status: 200 });
}
