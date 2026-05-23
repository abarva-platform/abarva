import { NextRequest } from 'next/server';
import { updateDiscoveryInstrumentEvidence } from '@/lib/instruments/authoring';
import { errorResponse, fail, mutationCtx, ok, requireInstrumentCtx } from '../../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as {
    assignmentId?: string;
    evidenceLink?: string | null;
    completionPct?: number;
    status?: string;
  } | null;
  if (!body?.assignmentId) return fail('bad_request', 'Expected assignmentId and evidence payload.', 400);

  try {
    const instrument = await updateDiscoveryInstrumentEvidence(body.assignmentId, body, mutationCtx(ctx));
    return ok({ instrument });
  } catch (error) {
    return errorResponse(error);
  }
}
