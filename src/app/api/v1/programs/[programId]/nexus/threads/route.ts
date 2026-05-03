// GET  /api/v1/programs/:programId/nexus/threads · list active Nexus threads
// POST /api/v1/programs/:programId/nexus/threads · create new thread

import { NextRequest } from 'next/server';
import { createThread, listThreads } from '@/lib/programs/nexus';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import type { NexusThreadMode } from '@/lib/programs/types.db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_MODES: NexusThreadMode[] = ['side_panel', 'module_drafting', 'cxo_takeover'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const url = new URL(req.url);
    const modeParam = url.searchParams.get('mode') as NexusThreadMode | null;
    const threads = await listThreads(ctx, programId, modeParam ? { mode: modeParam } : {});
    return Response.json({ threads });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/:id/nexus/threads]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const { supabase } = await getProgramsRouteSupabase('program_read');
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const body = (await req.json()) as {
      mode?: NexusThreadMode;
      title?: string;
      phaseNumber?: number;
      moduleKey?: string;
    };
    if (!body?.mode || !VALID_MODES.includes(body.mode)) {
      return Response.json({ error: 'bad_request', detail: `mode must be one of ${VALID_MODES.join(', ')}` }, { status: 400 });
    }
    const thread = await createThread(ctx, {
      programId,
      mode: body.mode,
      title: body.title,
      phaseNumber: body.phaseNumber,
      moduleKey: body.moduleKey,
    });
    return Response.json({ thread }, { status: 201 });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/nexus/threads]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
