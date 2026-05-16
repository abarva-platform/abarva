// GET /api/turn/[turnId]/trace · tenant-scoped reasoning-trace lookup.
//
// The turn_traces read runs behind the data-plane seam
// (`selectTurnTraceReadAdapter`): `supabase` by default, `azure-postgres`
// when `ABARVA_DATA_PLANE` opts in. The adapter enforces the tenancy join so
// a caller can only read traces for turns in their own tenant.

import { NextRequest, NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { selectTurnTraceReadAdapter } from '@/lib/data-plane/read-adapters/turnTraceReadAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ turnId: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  const { turnId } = await params;
  const result = await selectTurnTraceReadAdapter().getTurnTrace(turnId, ctx.clientId);

  if (result.kind === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }
  if (result.kind === 'not_found') {
    return NextResponse.json({ trace: null }, { status: 404 });
  }
  return NextResponse.json({ trace: result.trace });
}
