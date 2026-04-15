import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SOLUTIONS, SolutionKey } from '@/lib/solutions/solution-config'
import { ARCTURUS_DELIVERY_DEMO } from '@/lib/demo-data/arcturus-delivery-demo'
import { ARCTURUS_MARGIN_DEMO } from '@/lib/demo-data/arcturus-margin-demo'
import { ARCTURUS_TECH_DEMO } from '@/lib/demo-data/arcturus-tech-demo'
import { MERIDIAN_TECH_DEMO } from '@/lib/demo-data/meridian-tech-demo'
import { MERIDIAN_MARGIN_DEMO } from '@/lib/demo-data/meridian-margin-demo'
import { MERIDIAN_PDLC_DEMO } from '@/lib/demo-data/meridian-pdlc-demo'
import { ARCTURUS_DELIVERY_FULL_DEMO } from '@/lib/demo-data/arcturus-full-demo'
import { MERIDIAN_TECH_PARTIAL_DEMO } from '@/lib/demo-data/meridian-tech-partial-demo'
import { ARCTURUS_PDLC_DEMO } from '@/lib/demo-data/arcturus-pdlc-demo'
import {
  ARCTURUS_DELIVERY_PHASE0,
  ARCTURUS_MARGIN_PHASE0,
  ARCTURUS_TECH_PHASE0,
  ARCTURUS_PDLC_PHASE0,
  MERIDIAN_TECH_PHASE0,
} from '@/lib/dataset-extractor'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function getPhase0Data(clientId: string, solution: string) {
  if (clientId === 'arcturus' && solution === 'delivery') return ARCTURUS_DELIVERY_PHASE0
  if (clientId === 'arcturus' && solution === 'margin') return ARCTURUS_MARGIN_PHASE0
  if (clientId === 'arcturus' && solution === 'tech') return ARCTURUS_TECH_PHASE0
  if (clientId === 'arcturus' && solution === 'pdlc') return ARCTURUS_PDLC_PHASE0
  if (clientId === 'meridian' && solution === 'tech') return MERIDIAN_TECH_PHASE0
  return null
}

function getDemoData(clientId: string, solution: string, fullDemo = false) {
  if (fullDemo) {
    if (clientId === 'arcturus' && solution === 'delivery') return ARCTURUS_DELIVERY_FULL_DEMO as any
    if (clientId === 'meridian' && solution === 'tech') return MERIDIAN_TECH_PARTIAL_DEMO as any
  }
  if (clientId === 'arcturus' && solution === 'delivery') return ARCTURUS_DELIVERY_DEMO
  if (clientId === 'arcturus' && solution === 'margin') return ARCTURUS_MARGIN_DEMO
  if (clientId === 'arcturus' && solution === 'tech') return ARCTURUS_TECH_DEMO
  if (clientId === 'arcturus' && solution === 'pdlc') return ARCTURUS_PDLC_DEMO
  if (clientId === 'meridian' && solution === 'tech') return MERIDIAN_TECH_DEMO
  if (clientId === 'meridian' && solution === 'margin') return MERIDIAN_MARGIN_DEMO
  if (clientId === 'meridian' && solution === 'pdlc') return MERIDIAN_PDLC_DEMO
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  try {
    const { clientId, solution } = await params
    const { createdBy, fullDemo } = await request.json().catch(() => ({}))

    const solutionConfig = SOLUTIONS[solution as SolutionKey]
    if (!solutionConfig) {
      return NextResponse.json({ error: 'Invalid solution' }, { status: 400 })
    }

    const demoData = getDemoData(clientId, solution, !!fullDemo)
    if (!demoData) {
      return NextResponse.json({ error: `No demo data available for ${clientId} × ${solution}` }, { status: 400 })
    }

    // Support partial demos (in_progress engagements)
    const engStatus = (demoData as any).engagement_status ?? 'complete'
    const engCurrentPhase = (demoData as any).current_phase ?? 4

    const phase0Data = getPhase0Data(clientId, solution)
    const supabase = getSupabase()
    const clientNameMap: Record<string, string> = {
      arcturus: 'Arcturus Financial Group',
      meridian: 'Meridian Health System',
    }
    const clientName = clientNameMap[clientId] || clientId

    // Deactivate all existing engagements for this client×solution
    await supabase
      .from('engagements')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('solution', solution)

    // Create the demo engagement
    const { data: engagement, error: engErr } = await supabase
      .from('engagements')
      .insert({
        client_id: clientId,
        solution,
        status: engStatus,
        current_phase: engCurrentPhase,
        created_by: createdBy || 'system',
        engagement_name: demoData.engagement_name,
        is_active: true,
        metadata: { client_name: clientName, is_demo: true, is_full_demo: !!fullDemo }
      })
      .select()
      .single()

    if (engErr || !engagement) {
      return NextResponse.json({ error: engErr?.message || 'Failed to create engagement' }, { status: 500 })
    }

    // Create all 5 phases
    const phaseInserts = [0, 1, 2, 3, 4].map(num => {
      const demoPhase = demoData.phases.find((p: any) => p.phase_number === num)
      const phaseStatus = num === 0 ? 'approved' : (demoPhase?.status || 'locked')
      return {
        engagement_id: engagement.id,
        phase_number: num,
        phase_name: solutionConfig.phases[num as 0 | 1 | 2 | 3 | 4].name,
        status: phaseStatus,
        started_at: new Date(Date.now() - (4 - num) * 14 * 24 * 60 * 60 * 1000).toISOString(),
        approved_at: (phaseStatus === 'approved' || phaseStatus === 'complete')
          ? new Date(Date.now() - (4 - num) * 10 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        approved_by: (phaseStatus === 'approved' || phaseStatus === 'complete') ? 'Anand Sundaram' : null,
      }
    })

    const { data: phases, error: phasesErr } = await supabase
      .from('engagement_phases')
      .insert(phaseInserts)
      .select()

    if (phasesErr || !phases) {
      return NextResponse.json({ error: phasesErr?.message || 'Failed to create phases' }, { status: 500 })
    }

    // Seed Phase 0 data
    const phase0 = phases.find(p => p.phase_number === 0)!

    // Phase 0 workstream
    const { data: phase0Ws } = await supabase
      .from('phase_workstreams')
      .insert({
        phase_id: phase0.id,
        name: 'Data Analysis',
        description: 'Automated analysis of uploaded datasets',
        order_index: 0,
        created_by: 'system'
      })
      .select()
      .single()

    if (phase0Data) {
      // Phase 0 output
      await supabase.from('phase_outputs').insert({
        phase_id: phase0.id,
        output_type: 'readiness_scorecard',
        title: 'Readiness Assessment',
        content: phase0Data,
        version: 1,
        status: 'approved',
        approved_at: new Date(Date.now() - 4 * 14 * 24 * 60 * 60 * 1000).toISOString(),
        approved_by: 'Anand Sundaram'
      })

      // Genome matches
      for (const gm of phase0Data.genome_matches) {
        await supabase.from('genome_matches').upsert({
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

      // Phase 0 dimension scores
      for (const [dimension, data] of Object.entries(phase0Data.dimension_scores)) {
        await supabase.from('phase0_scores').insert({
          engagement_id: engagement.id,
          solution,
          dimension,
          score: (data as any).score,
          evidence: (data as any).evidence,
          missing_data: (data as any).missing_data,
          what_it_unlocks: (data as any).what_it_unlocks
        })
      }

      // Phase 0 findings
      for (let i = 0; i < phase0Data.top_findings.length; i++) {
        const f = phase0Data.top_findings[i]
        await supabase.from('phase_findings').insert({
          phase_id: phase0.id,
          workstream_id: phase0Ws?.id || null,
          title: f.title,
          description: f.description,
          source_files: f.source_files,
          genome_pattern: f.genome_pattern,
          severity: f.severity,
          status: 'confirmed',
          is_published: true,
          display_order: i,
          created_by: 'maestro_ai'
        })
      }

      // Phase 0 AI message
      await supabase.from('workstream_messages').insert({
        workstream_id: phase0Ws?.id,
        role: 'maestro_ai',
        actor_name: 'AbarVa AI',
        content: `Phase 0 readiness assessment complete for ${clientName} × ${solutionConfig.name}.\n\nOverall score: **${phase0Data.overall_score}/100** — ${phase0Data.overall_verdict.toUpperCase()}\n\n${phase0Data.verdict_summary}\n\n**${phase0Data.genome_matches.length} Genome patterns confirmed:** ${phase0Data.genome_matches.map(g => `${g.code} (${Math.round(g.failure_rate * 100)}% failure rate)`).join(', ')}\n\n**Recommended action:** ${phase0Data.recommended_action}`,
        is_internal: false
      })
    }

    // Seed Phases 1–4
    for (const demoPhase of demoData.phases) {
      const dbPhase = phases.find(p => p.phase_number === demoPhase.phase_number)
      if (!dbPhase) continue

      // Create workstreams and messages
      for (let wsIdx = 0; wsIdx < demoPhase.workstreams.length; wsIdx++) {
        const ws = demoPhase.workstreams[wsIdx]

        const { data: dbWs } = await supabase
          .from('phase_workstreams')
          .insert({
            phase_id: dbPhase.id,
            name: ws.name,
            description: solutionConfig.phases[demoPhase.phase_number as 0 | 1 | 2 | 3 | 4]
              .default_workstreams[wsIdx]?.description || ws.name,
            order_index: wsIdx,
            created_by: 'system'
          })
          .select()
          .single()

        if (!dbWs) continue

        // Insert messages in order
        for (const msg of ws.messages) {
          await supabase.from('workstream_messages').insert({
            workstream_id: dbWs.id,
            role: msg.role === 'maestro_ai' ? 'maestro_ai' : 'admin',
            actor_name: msg.actor_name,
            content: msg.content,
            is_internal: false
          })
        }
      }

      // Create phase output (optional — in_progress phases may not have output)
      if (demoPhase.output) {
        const outputStatus = demoPhase.output.status
        await supabase.from('phase_outputs').insert({
          phase_id: dbPhase.id,
          output_type: demoPhase.output.output_type,
          title: demoPhase.output.title,
          content: demoPhase.output.content,
          version: 1,
          status: outputStatus,
          approved_at: outputStatus === 'approved'
            ? new Date(Date.now() - (4 - demoPhase.phase_number) * 10 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          approved_by: outputStatus === 'approved' ? 'Anand Sundaram' : null
        })
      }

      // Seed phase-level findings (for partial/in-progress demos)
      const phaseFindings = (demoPhase as any).findings as any[] | undefined
      if (phaseFindings?.length) {
        for (let i = 0; i < phaseFindings.length; i++) {
          const f = phaseFindings[i]
          await supabase.from('phase_findings').insert({
            phase_id: dbPhase.id,
            workstream_id: null,
            title: f.title,
            description: f.description,
            source_files: f.source_files,
            genome_pattern: f.genome_pattern,
            severity: f.severity,
            status: 'confirmed',
            is_published: true,
            display_order: i,
            created_by: 'maestro_ai'
          })
        }
      }

      // Seed phase-level genome matches (for partial/in-progress demos)
      const phaseGenomeMatches = (demoPhase as any).genome_matches as any[] | undefined
      if (phaseGenomeMatches?.length) {
        for (const gm of phaseGenomeMatches) {
          await supabase.from('genome_matches').upsert({
            engagement_id: engagement.id,
            pattern_code: gm.code,
            pattern_name: gm.name,
            failure_rate: gm.failure_rate,
            evidence: gm.evidence,
            confidence: gm.confidence,
            phase_identified: demoPhase.phase_number,
            source_files: gm.source_files
          }, { onConflict: 'engagement_id,pattern_code' })
        }
      }
    }

    // Log activity
    await supabase.from('engagement_activity').insert({
      engagement_id: engagement.id,
      phase_id: phase0.id,
      actor_name: createdBy || 'System',
      actor_role: 'admin',
      action: 'engagement_started',
      description: `Demo engagement seeded for ${clientName} × ${solutionConfig.name} — all phases complete`,
      metadata: { is_demo: true }
    })

    return NextResponse.json({
      success: true,
      engagementId: engagement.id,
      message: `Demo engagement seeded: ${demoData.engagement_name}`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
