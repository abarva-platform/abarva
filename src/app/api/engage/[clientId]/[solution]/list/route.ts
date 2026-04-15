import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  try {
    const { clientId, solution } = await params
    const supabase = getSupabase()

    const { data: engagements, error } = await supabase
      .from('engagements')
      .select('id, engagement_name, is_active, current_phase, status, started_at, metadata')
      .eq('client_id', clientId)
      .eq('solution', solution)
      .order('started_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ engagements: engagements || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
