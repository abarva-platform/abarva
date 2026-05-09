// GET/POST /api/v1/programs/:programId/nexus/current-state-brief
//
// First-class CXO current-state briefing for Nexus. GET returns the
// full Move-shaped brief; POST answers one current-state question
// against the same brief contract.

import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  buildNexusCurrentStateBriefing,
  serializeNexusCurrentStateBriefing,
} from '@/lib/programs/nexus-current-state-briefing';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadBriefing(programId: string) {
  const { supabase } = await getProgramsRouteSupabase('detail');
  const ctx = await requireTenancy();
  const program = await getProgramById(ctx, programId, { supabase });
  if (!program) {
    return { response: Response.json({ error: 'not_found' }, { status: 404 }) };
  }
  if (program.archivedAt || program.deletedAt) {
    return { response: Response.json({ error: 'archived_or_deleted' }, { status: 410 }) };
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return { response: Response.json({ error: 'no_client' }, { status: 403 }) };
  }

  const briefing = await buildNexusCurrentStateBriefing({
    ctx,
    tenantKey: clientKeyToBrokerTenantKey(activeClient.key),
    program,
  });

  return { briefing };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const result = await loadBriefing(programId);
    if (result.response) return result.response;
    return Response.json({ briefing: serializeNexusCurrentStateBriefing(result.briefing) });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /api/v1/programs/:programId/nexus/current-state-brief]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    let body: { question?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return Response.json({ error: 'bad_request', detail: 'malformed JSON' }, { status: 400 });
    }

    const question = body.question?.trim();
    if (!question) {
      return Response.json({ error: 'bad_request', detail: 'question required' }, { status: 400 });
    }

    const result = await loadBriefing(programId);
    if (result.response) return result.response;
    return Response.json({
      answer: result.briefing.answerQuestion(question),
      citations: result.briefing.citations,
      briefingVersion: result.briefing.briefingVersion,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /api/v1/programs/:programId/nexus/current-state-brief]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
