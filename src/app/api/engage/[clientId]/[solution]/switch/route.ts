import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  try {
    const { clientId, solution } = await params
    const { engagementId } = await request.json()

    if (!engagementId) {
      return NextResponse.json({ error: 'engagementId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Deactivate all engagements for this client×solution
    const { error: deactivateErr } = await supabase
      .from('engagements')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('solution', solution)

    if (deactivateErr) {
      return NextResponse.json({ error: deactivateErr.message }, { status: 500 })
    }

    // Activate the selected one
    const { data: engagement, error: activateErr } = await supabase
      .from('engagements')
      .update({ is_active: true })
      .eq('id', engagementId)
      .eq('client_id', clientId)
      .eq('solution', solution)
      .select()
      .single()

    if (activateErr || !engagement) {
      return NextResponse.json({ error: activateErr?.message || 'Engagement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, engagement })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
