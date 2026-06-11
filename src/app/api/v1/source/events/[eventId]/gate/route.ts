// GET /api/v1/source/events/{eventId}/gate?stageKey=...&satisfied=a,b
//
// Read-only stage-gate assessment + Nexus guidance for the given stage and current
// satisfied requirement keys. Drives the Source readiness UI before a Maestro decision.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getAmsStageGate, AMS_STAGE_GATES } from '@/lib/source/stage-gate/ams-stage-gates';
import { assessStageGate } from '@/lib/source/stage-gate/gate-resolver';
import { buildGateGuidance } from '@/lib/source/stage-gate/gate-guidance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctxParam: { params: Promise<{ eventId: string }> }) {
  try {
    await requireTenancy();
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim()) return Response.json({ error: 'bad_request', detail: 'eventId is required.' }, { status: 400 });

    const url = new URL(req.url);
    const stageKey = url.searchParams.get('stageKey');
    if (!stageKey) {
      // no stage → return the stage list so the UI can pick one
      return Response.json({ stages: AMS_STAGE_GATES.map((s) => ({ stageKey: s.stageKey, stageNumber: s.stageNumber, stageName: s.stageName })) });
    }
    const def = getAmsStageGate(stageKey);
    if (!def) return Response.json({ error: 'bad_request', detail: 'Unknown stageKey (AMS).' }, { status: 400 });

    const satisfied = (url.searchParams.get('satisfied') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const assessment = assessStageGate(def, { satisfiedRequirementKeys: new Set(satisfied) });
    return Response.json({ assessment, guidance: buildGateGuidance(assessment) });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch { /* not tenancy */ }
    console.error('[GET /api/v1/source/events/[eventId]/gate]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
