import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  try {
    const { clientId, solution } = await params
    const supabase = getSupabase()

    // Get engagement
    const { data: engagement, error: engErr } = await supabase
      .from('engagements')
      .select('*')
      .eq('client_id', clientId)
      .eq('solution', solution)
      .single()

    if (engErr || !engagement) {
      return NextResponse.json({ exists: false }, { status: 404 })
    }

    // Get phases with their workstreams, outputs, and findings
    const { data: phases, error: phasesErr } = await supabase
      .from('engagement_phases')
      .select('*')
      .eq('engagement_id', engagement.id)
      .order('phase_number')

    if (phasesErr) {
      return NextResponse.json({ error: phasesErr.message }, { status: 500 })
    }

    // Get all workstreams for all phases
    const phaseIds = phases?.map(p => p.id) || []

    const [workstreamsRes, outputsRes, findingsRes, genomeRes, activityRes] = await Promise.all([
      supabase
        .from('phase_workstreams')
        .select('*')
        .in('phase_id', phaseIds)
        .order('order_index'),
      supabase
        .from('phase_outputs')
        .select('*')
        .in('phase_id', phaseIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
      supabase
        .from('phase_findings')
        .select('*')
        .in('phase_id', phaseIds)
        .neq('status', 'removed')
        .order('display_order'),
      supabase
        .from('genome_matches')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('created_at'),
      supabase
        .from('engagement_activity')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    // Get all outputs (draft + published) for Maestro view
    const searchParams = request.nextUrl.searchParams
    const includeDraft = searchParams.get('includeDraft') === 'true'

    let allOutputs = outputsRes.data || []
    if (includeDraft) {
      const { data: draftOutputs } = await supabase
        .from('phase_outputs')
        .select('*')
        .in('phase_id', phaseIds)
        .order('created_at', { ascending: false })
      allOutputs = draftOutputs || []
    }

    return NextResponse.json({
      exists: true,
      engagement,
      phases: phases || [],
      workstreams: workstreamsRes.data || [],
      outputs: allOutputs,
      findings: findingsRes.data || [],
      genomeMatches: genomeRes.data || [],
      activity: activityRes.data || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
