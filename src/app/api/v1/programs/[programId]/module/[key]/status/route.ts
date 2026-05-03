// POST /api/v1/programs/:programId/module/:key/status
// Body: { status: ModuleStatus, notes?: string, assignedUserId?: string }
// Transitions a module's lifecycle state. Idempotent via module_state_log audit.

import { NextRequest } from 'next/server';
import { setModuleStatus } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import type { ModuleStatus } from '@/lib/programs/types.db';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: ModuleStatus[] = ['not_started', 'in_progress', 'blocked', 'completed', 'skipped'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string; key: string }> }) {
  try {
    const { programId, key } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const body = (await req.json()) as { status?: ModuleStatus; notes?: string; assignedUserId?: string };
    if (!body?.status || !VALID.includes(body.status)) {
      return Response.json({ error: 'bad_request', detail: `status must be one of ${VALID.join(', ')}` }, { status: 400 });
    }
    const updated = await setModuleStatus(ctx, programId, key, body.status, {
      notes: body.notes,
      assignedUserId: body.assignedUserId,
    }, { supabase });
    if (!updated) return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json({ ok: true, moduleKey: key, status: body.status });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/module/:key/status]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
