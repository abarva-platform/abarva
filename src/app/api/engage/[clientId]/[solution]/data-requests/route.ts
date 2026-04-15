import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  const { clientId, solution } = await params
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  // Find engagement
  const { data: engagement, error: engErr } = await supabase
    .from('engagements')
    .select('id')
    .eq('client_id', clientId)
    .eq('solution', solution)
    .maybeSingle()

  if (engErr) {
    return NextResponse.json({ error: engErr.message }, { status: 500 })
  }
  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
  }

  let query = supabase
    .from('data_requests')
    .select('*')
    .eq('engagement_id', engagement.id)
    .order('created_at', { ascending: true })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: dataRequests, error: drErr } = await query

  if (drErr) {
    return NextResponse.json({ error: drErr.message }, { status: 500 })
  }

  return NextResponse.json({ data_requests: dataRequests ?? [] })
}
