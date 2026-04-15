import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SOLUTIONS, SolutionKey } from '@/lib/solutions/solution-config'
import { ARCTURUS_DELIVERY_PHASE0 } from '@/lib/dataset-extractor'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientName, solution, createdBy } = await request.json()

    if (!clientId || !solution || !clientName) {
      return NextResponse.json({ error: 'clientId, clientName, solution required' }, { status: 400 })
    }

    const solutionConfig = SOLUTIONS[solution as SolutionKey]
    if (!solutionConfig) {
      return NextResponse.json({ error: 'Invalid solution' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Upsert engagement (idempotent)
    const { data: engagement, error: engErr } = await supabase
      .from('engagements')
      .upsert({
        client_id: clientId,
        solution,
        status: 'active',
        current_phase: 0,
        created_by: createdBy || 'system',
        metadata: { client_name: clientName }
      }, { onConflict: 'client_id,solution' })
      .select()
      .single()

    if (engErr) {
      return NextResponse.json({ error: engErr.message }, { status: 500 })
    }

    // Create phases 0-4 (locked except phase 0 which is in_progress)
    const phaseInserts = [0, 1, 2, 3, 4].map(num => ({
      engagement_id: engagement.id,
      phase_number: num,
      phase_name: solutionConfig.phases[num as 0|1|2|3|4].name,
      status: num === 0 ? 'in_progress' : 'locked',
      started_at: num === 0 ? new Date().toISOString() : null
    }))

    const { data: phases, error: phaseErr } = await supabase
      .from('engagement_phases')
      .upsert(phaseInserts, { onConflict: 'engagement_id,phase_number' })
      .select()

    if (phaseErr) {
      return NextResponse.json({ error: phaseErr.message }, { status: 500 })
    }

    const phase0 = phases?.find(p => p.phase_number === 0)
    if (!phase0) {
      return NextResponse.json({ error: 'Phase 0 creation failed' }, { status: 500 })
    }

    // Create Phase 0 workstream
    const phase0Config = solutionConfig.phases[0]
    const { data: workstream, error: wsErr } = await supabase
      .from('phase_workstreams')
      .upsert({
        phase_id: phase0.id,
        name: phase0Config.default_workstreams[0].name,
        description: phase0Config.default_workstreams[0].description,
        order_index: 0,
        created_by: createdBy || 'system'
      })
      .select()
      .single()

    if (wsErr) {
      return NextResponse.json({ error: wsErr.message }, { status: 500 })
    }

    // For Arcturus × Delivery: use hardcoded Phase 0 output
    const isHardcoded = clientId === 'arcturus' && solution === 'delivery'
    const phase0Data = isHardcoded ? ARCTURUS_DELIVERY_PHASE0 : null

    // Store Phase 0 output if hardcoded
    if (phase0Data) {
      await supabase
        .from('phase_outputs')
        .upsert({
          phase_id: phase0.id,
          output_type: 'readiness_scorecard',
          title: phase0Config.output_title,
          content: phase0Data,
          version: 1,
          status: 'draft'
        }, { onConflict: 'phase_id' })

      // Store genome matches
      for (const gm of phase0Data.genome_matches) {
        await supabase
          .from('genome_matches')
          .upsert({
            engagement_id: engagement.id,
            pattern_code: gm.code,
            pattern_name: gm.name,
            failure_rate: gm.failure_rate,
            evidence: gm.evidence,
            confidence: gm.confidence,
            phase_identified: 0,
            source_files: gm.source_files
          }, { onConflict: 'engagement_id,pattern_code' })
      }

      // Store Phase 0 dimension scores
      for (const [dimension, data] of Object.entries(phase0Data.dimension_scores)) {
        await supabase
          .from('phase0_scores')
          .insert({
            engagement_id: engagement.id,
            solution,
            dimension,
            score: (data as any).score,
            evidence: (data as any).evidence,
            missing_data: (data as any).missing_data,
            what_it_unlocks: (data as any).what_it_unlocks
          })
          .select()
      }

      // Store top findings as phase findings
      for (let i = 0; i < phase0Data.top_findings.length; i++) {
        const f = phase0Data.top_findings[i]
        await supabase
          .from('phase_findings')
          .insert({
            phase_id: phase0.id,
            workstream_id: workstream?.id || null,
            title: f.title,
            description: f.description,
            source_files: f.source_files,
            genome_pattern: f.genome_pattern,
            severity: f.severity,
            status: 'confirmed',
            is_published: false,
            display_order: i,
            created_by: 'maestro_ai'
          })
      }

      // Add AI opening message
      await supabase
        .from('workstream_messages')
        .insert({
          workstream_id: workstream?.id,
          role: 'maestro_ai',
          actor_name: 'AbarVa AI',
          content: `Phase 0 readiness assessment complete for ${clientName} × ${solutionConfig.name}.\n\nOverall score: **${phase0Data.overall_score}/100** — ${phase0Data.overall_verdict.toUpperCase()}\n\n${phase0Data.verdict_summary}\n\n**${phase0Data.genome_matches.length} Genome patterns confirmed:** ${phase0Data.genome_matches.map(g => `${g.code} (${Math.round(g.failure_rate * 100)}% failure rate)`).join(', ')}\n\n**Recommended action:** ${phase0Data.recommended_action}`,
          is_internal: false
        })
    }

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phase0.id,
        actor_name: createdBy || 'System',
        actor_role: 'admin',
        action: 'engagement_started',
        description: `${solutionConfig.name} engagement started for ${clientName}`,
        metadata: { is_hardcoded: isHardcoded }
      })

    return NextResponse.json({
      engagementId: engagement.id,
      phase0Id: phase0.id,
      workstreamId: workstream?.id,
      isHardcoded,
      phase0Data
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
