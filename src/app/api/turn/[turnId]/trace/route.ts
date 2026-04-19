import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ turnId: string }> },
) {
  const { turnId } = await params;
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('turn_traces')
    .select('turn_id, engagement_id, model, input_tokens, output_tokens, latency_ms, steps, created_at')
    .eq('turn_id', turnId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trace: data ?? null });
}
