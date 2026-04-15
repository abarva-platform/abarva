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
    const { action, actorId, actorName, actorRole, comment, outputVersion } = await request.json()

    if (!action || !['approved', 'disputed'].includes(action)) {
      return NextResponse.json({ error: 'action must be approved or disputed' }, { status: 400 })
    }

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

    const engagement = phase.engagements as any
    const solution = SOLUTIONS[engagement.solution as SolutionKey]

    // Record the approval action
    await supabase
      .from('phase_approvals')
      .insert({
        phase_id: phaseId,
        action,
        actor_id: actorId,
        actor_name: actorName || 'Unknown',
        actor_role: actorRole || 'client',
        comment,
        output_version: outputVersion
      })

    let newPhaseStatus = ''
    let nextPhaseUnlocked = false

    if (action === 'approved') {
      newPhaseStatus = 'approved'

      // Update phase to approved
      await supabase
        .from('engagement_phases')
        .update({
          status: 'approved',
          approved_at: now,
          approved_by: actorName,
          approved_by_role: actorRole
        })
        .eq('id', phaseId)

      // Update output to approved
      await supabase
        .from('phase_outputs')
        .update({ status: 'approved', approved_at: now, approved_by: actorName })
        .eq('phase_id', phaseId)
        .eq('status', 'published')

      // Unlock next phase
      const nextPhaseNum = (phase.phase_number + 1) as PhaseKey
      if (nextPhaseNum <= 4) {
        const nextPhaseConfig = solution.phases[nextPhaseNum]

        const { data: nextPhase } = await supabase
          .from('engagement_phases')
          .update({
            status: 'in_progress',
            started_at: now
          })
          .eq('engagement_id', engagement.id)
          .eq('phase_number', nextPhaseNum)
          .select()
          .single()

        if (nextPhase) {
          nextPhaseUnlocked = true

          // Update engagement current_phase
          await supabase
            .from('engagements')
            .update({ current_phase: nextPhaseNum })
            .eq('id', engagement.id)

          // Create default workstreams for next phase
          for (let i = 0; i < nextPhaseConfig.default_workstreams.length; i++) {
            const ws = nextPhaseConfig.default_workstreams[i]

            const { data: newWs } = await supabase
              .from('phase_workstreams')
              .insert({
                phase_id: nextPhase.id,
                name: ws.name,
                description: ws.description,
                order_index: i,
                created_by: 'system'
              })
              .select()
              .single()

            // Add opening AI message for each workstream
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

          // Log phase unlock
          await supabase
            .from('engagement_activity')
            .insert({
              engagement_id: engagement.id,
              phase_id: nextPhase.id,
              actor_name: 'System',
              actor_role: 'system',
              action: 'phase_unlocked',
              description: `Phase ${nextPhaseNum} — ${nextPhaseConfig.name} unlocked`,
              metadata: { unlocked_by_phase: phase.phase_number }
            })
        }
      }
    } else {
      // disputed — send back to Maestro
      newPhaseStatus = 'disputed'

      await supabase
        .from('engagement_phases')
        .update({
          status: 'disputed',
          dispute_count: (phase.dispute_count || 0) + 1
        })
        .eq('id', phaseId)

      // Update output back to draft
      await supabase
        .from('phase_outputs')
        .update({ status: 'draft' })
        .eq('phase_id', phaseId)
        .eq('status', 'published')
    }

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        actor_name: actorName || 'Client',
        actor_role: actorRole || 'client',
        action: action === 'approved' ? 'phase_approved' : 'output_disputed',
        description: action === 'approved'
          ? `Phase ${phase.phase_number} approved${nextPhaseUnlocked ? ' — next phase unlocked' : ''}`
          : `Phase ${phase.phase_number} output disputed: ${comment || 'No comment'}`,
        metadata: { comment, output_version: outputVersion }
      })

    return NextResponse.json({
      success: true,
      phaseStatus: newPhaseStatus,
      nextPhaseUnlocked
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
