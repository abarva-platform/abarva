// PATCH /api/v1/programs/:programId/phase
// Body: { phase: number }
//
// Demo affordance — advances the program to the requested phase by writing
// to the in-memory override store. No DB write occurs; resets on server restart.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import { setPhaseOverride } from '@/lib/programs/phase-overrides';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_PHASE = 1;
const MAX_PHASE = 6;

type RouteCtx = { params: Promise<{ programId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireTenancy();
    const { programId } = await params;

    const body = (await req.json()) as { phase?: unknown };
    const phase = body?.phase;

    if (
      typeof phase !== 'number' ||
      !Number.isInteger(phase) ||
      phase < MIN_PHASE ||
      phase > MAX_PHASE
    ) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `phase must be an integer between ${MIN_PHASE} and ${MAX_PHASE}`,
        },
        { status: 400 },
      );
    }

    setPhaseOverride(programId, phase as ProgramPhaseId);

    return Response.json({ ok: true, programId, phase });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[PATCH /api/v1/programs/:programId/phase]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
