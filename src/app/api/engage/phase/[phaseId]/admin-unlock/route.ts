import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SOLUTIONS, SolutionKey, PhaseKey } from '@/lib/solutions/solution-config'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params
    const { actorName } = await request.json()

    const supabase = getSupabase()
    const now = new Date().toISOString()

    // Get phase with engagement
    const { data: phase, error: phaseErr } = await supabase
      .from('engagement_phases')
      .select('*, engagements(*)')
      .eq('id', phaseId)
      .single()

    if (phaseErr || !phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    if (phase.status !== 'locked') {
      return NextResponse.json({ error: 'Phase is not locked' }, { status: 400 })
    }

    const engagement = phase.engagements as any
    const solution = SOLUTIONS[engagement.solution as SolutionKey]
    const phaseNum = phase.phase_number as PhaseKey
    const phaseConfig = solution.phases[phaseNum]

    // Unlock the phase
    await supabase
      .from('engagement_phases')
      .update({ status: 'in_progress', started_at: now })
      .eq('id', phaseId)

    // Update engagement current_phase if this is higher than current
    if (phaseNum > (engagement.current_phase ?? 0)) {
      await supabase
        .from('engagements')
        .update({ current_phase: phaseNum })
        .eq('id', engagement.id)
    }

    // Create default workstreams if they don't already exist
    const { data: existingWs } = await supabase
      .from('phase_workstreams')
      .select('id')
      .eq('phase_id', phaseId)

    if (!existingWs || existingWs.length === 0) {
      for (let i = 0; i < phaseConfig.default_workstreams.length; i++) {
        const ws = phaseConfig.default_workstreams[i]

        const { data: newWs } = await supabase
          .from('phase_workstreams')
          .insert({
            phase_id: phaseId,
            name: ws.name,
            description: ws.description,
            order_index: i,
            created_by: 'admin'
          })
          .select()
          .single()

        if (newWs && ws.opening_prompt) {
          await supabase
            .from('workstream_messages')
            .insert({
              workstream_id: newWs.id,
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: ws.opening_prompt,
              is_internal: false
            })
        }
      }
    }

    // Log the admin override in activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        actor_name: actorName || 'Admin',
        actor_role: 'admin',
        action: 'phase_unlocked',
        description: `Admin override — Phase ${phaseNum} (${phaseConfig.name}) unlocked by ${actorName || 'Admin'} · ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        metadata: { admin_override: true, unlocked_by: actorName }
      })

    return NextResponse.json({
      success: true,
      phaseId,
      phaseNumber: phaseNum,
      phaseName: phaseConfig.name
    })
  } catch (err: any) {
    console.error('[admin-unlock] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
