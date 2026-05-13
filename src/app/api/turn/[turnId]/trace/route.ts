import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

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
  const sb = getServerSupabase();

  // Join through engagements.client_id so callers can only read traces for
  // turns that belong to their own tenant. Without this join, any caller with
  // a turn UUID could read another tenant's complete reasoning trace.
  const { data, error } = await sb
    .from('turn_traces')
    .select(
      'turn_id, engagement_id, model, input_tokens, output_tokens, latency_ms, steps, created_at, engagements!inner(client_id)',
    )
    .eq('turn_id', turnId)
    .eq('engagements.client_id', ctx.clientId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ trace: null }, { status: 404 });
  // Strip the join column before returning.
  const { engagements: _engagements, ...trace } = data as Record<string, unknown> & {
    engagements?: unknown;
  };
  return NextResponse.json({ trace });
}
