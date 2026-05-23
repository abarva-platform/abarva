import { NextRequest } from 'next/server';
import { listDiscoveryKitForMove } from '@/lib/instruments/authoring';
import { errorResponse, ok, requireInstrumentCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moveId: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const { moveId } = await params;
  try {
    const instruments = await listDiscoveryKitForMove(moveId, ctx.clientId);
    return ok({ instruments });
  } catch (error) {
    return errorResponse(error);
  }
}
