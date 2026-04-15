import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SOLUTIONS, SolutionKey } from '@/lib/solutions/solution-config'
import { ARCTURUS_DELIVERY_PHASE0, ARCTURUS_MARGIN_PHASE0, ARCTURUS_TECH_PHASE0, ARCTURUS_PDLC_PHASE0, MERIDIAN_TECH_PHASE0, Phase0Output } from '@/lib/dataset-extractor'

function getHardcodedPhase0(clientId: string, solution: string): Phase0Output | null {
  if (clientId === 'arcturus') {
    if (solution === 'delivery') return ARCTURUS_DELIVERY_PHASE0
    if (solution === 'margin') return ARCTURUS_MARGIN_PHASE0
    if (solution === 'tech') return ARCTURUS_TECH_PHASE0
    if (solution === 'pdlc') return ARCTURUS_PDLC_PHASE0
  }
  if (clientId === 'meridian') {
    if (solution === 'tech') return MERIDIAN_TECH_PHASE0
  }
  return null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientName, solution, createdBy, engagementName } = await request.json()

    if (!clientId || !solution || !clientName) {
      return NextResponse.json({ error: 'clientId, clientName, solution required' }, { status: 400 })
    }

    const solutionConfig = SOLUTIONS[solution as SolutionKey]
    if (!solutionConfig) {
      return NextResponse.json({ error: 'Invalid solution' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Deactivate all existing engagements for this client×solution
    await supabase
      .from('engagements')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('solution', solution)

    // Derive a default name if none provided
    const defaultName = `${clientName} — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    const finalName = engagementName?.trim() || defaultName

    // Always INSERT a new engagement (no upsert — UNIQUE constraint removed)
    const { data: engagement, error: engErr } = await supabase
      .from('engagements')
      .insert({
        client_id: clientId,
        solution,
        status: 'active',
        current_phase: 0,
        created_by: createdBy || 'system',
        engagement_name: finalName,
        is_active: true,
        metadata: { client_name: clientName }
      })
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

    // For known client×solution pairs: use hardcoded Phase 0 output
    const phase0Data = getHardcodedPhase0(clientId, solution)
    const isHardcoded = !!phase0Data

    // Store Phase 0 output if hardcoded — check existence first (upsert won't work, no unique on phase_id)
    if (phase0Data) {
      const { data: existingOutput } = await supabase
        .from('phase_outputs')
        .select('id')
        .eq('phase_id', phase0.id)
        .maybeSingle()

      if (!existingOutput) {
        await supabase
          .from('phase_outputs')
          .insert({
            phase_id: phase0.id,
            output_type: 'readiness_scorecard',
            title: phase0Config.output_title,
            content: phase0Data,
            version: 1,
            status: 'draft'
          })

        const p0 = phase0Data as any

        // Store genome matches — support both schema shapes
        const genomeList: any[] = p0.genome_matches || []
        for (const gm of genomeList) {
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

        // Store Phase 0 dimension scores — support both schema shapes
        if (p0.dimension_scores) {
          for (const [dimension, data] of Object.entries(p0.dimension_scores)) {
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
          }
        } else if (p0.scorecard?.dimensions) {
          for (const dim of p0.scorecard.dimensions) {
            await supabase
              .from('phase0_scores')
              .insert({
                engagement_id: engagement.id,
                solution,
                dimension: dim.id,
                score: dim.score,
                evidence: dim.detail,
                missing_data: null,
                what_it_unlocks: null
              })
          }
        }

        // Store top findings — support both schema shapes
        const findingsList: any[] = p0.top_findings || p0.findings || []
        for (let i = 0; i < findingsList.length; i++) {
          const f = findingsList[i]
          await supabase
            .from('phase_findings')
            .insert({
              phase_id: phase0.id,
              workstream_id: workstream?.id || null,
              title: f.title,
              description: f.description || f.body || '',
              source_files: f.source_files || [],
              genome_pattern: f.genome_pattern || f.patternId || null,
              severity: f.severity ? f.severity.toLowerCase() : (f.type ? f.type.toLowerCase() : 'medium'),
              status: 'confirmed',
              is_published: false,
              display_order: i,
              created_by: 'maestro_ai'
            })
        }

        // Add AI opening message — use openingMessage field if present (new schema)
        const openingContent = p0.openingMessage ||
          `Phase 0 readiness assessment complete for ${clientName} × ${solutionConfig.name}.\n\nOverall score: **${p0.overall_score}/100** — ${p0.overall_verdict?.toUpperCase()}\n\n${p0.verdict_summary}\n\n**${genomeList.length} Genome patterns confirmed:** ${genomeList.map((g: any) => `${g.code} (${Math.round(g.failure_rate * 100)}% failure rate)`).join(', ')}\n\n**Recommended action:** ${p0.recommended_action}`

        await supabase
          .from('workstream_messages')
          .insert({
            workstream_id: workstream?.id,
            role: 'maestro_ai',
            actor_name: 'AbarVa AI',
            content: openingContent,
            is_internal: false
          })
      }
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
