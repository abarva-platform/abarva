import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildOutputGenerationPrompt, PromptContext } from '@/lib/prompts/engagement-prompts'
import { SOLUTIONS, SolutionKey, PhaseKey } from '@/lib/solutions/solution-config'
import { getPostHogClient } from '@/lib/posthog-server'

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
    const { generatedBy } = await request.json()
    const supabase = getSupabase()

    // Get phase with engagement context
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
    const phaseConfig = solution.phases[phase.phase_number as PhaseKey]

    // Get all workstreams for this phase
    const { data: workstreams } = await supabase
      .from('phase_workstreams')
      .select('*')
      .eq('phase_id', phaseId)
      .order('order_index')

    // Get messages for each workstream (summarise for context)
    const workstreamSummaries: string[] = []
    for (const ws of workstreams || []) {
      const { data: messages } = await supabase
        .from('workstream_messages')
        .select('role, content, created_at')
        .eq('workstream_id', ws.id)
        .order('created_at')

      if (messages && messages.length > 0) {
        const summary = `WORKSTREAM: ${ws.name}\n${messages.map((m: any) =>
          `[${m.role === 'maestro_ai' ? 'AI' : 'Maestro'}]: ${m.content.slice(0, 500)}${m.content.length > 500 ? '...' : ''}`
        ).join('\n\n')}`
        workstreamSummaries.push(summary)
      }
    }

    // Get Phase 0 output
    let phase0Output = null
    if (phase.phase_number > 0) {
      const { data: p0 } = await supabase
        .from('engagement_phases')
        .select('id')
        .eq('engagement_id', engagement.id)
        .eq('phase_number', 0)
        .single()

      if (p0) {
        const { data: p0out } = await supabase
          .from('phase_outputs')
          .select('content')
          .eq('phase_id', p0.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (p0out) phase0Output = p0out.content
      }
    }

    // Get genome matches
    const { data: genomeMatches } = await supabase
      .from('genome_matches')
      .select('*')
      .eq('engagement_id', engagement.id)

    const ctx: PromptContext = {
      clientName: engagement.metadata?.client_name || engagement.client_id,
      clientId: engagement.client_id,
      solution: engagement.solution as SolutionKey,
      phase: phase.phase_number as PhaseKey,
      workstreamName: 'All workstreams',
      phase0Output,
      genomeMatches: genomeMatches || []
    }

    const prompt = buildOutputGenerationPrompt(
      phaseConfig.output_type,
      phase.phase_number as PhaseKey,
      ctx,
      workstreamSummaries
    )

    // Call Claude to generate structured output
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    let outputContent: any = {}
    const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/) ||
                      rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        outputContent = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch {
        outputContent = { raw: rawContent }
      }
    } else {
      outputContent = { raw: rawContent }
    }

    // Save output as draft
    const { data: output, error: outErr } = await supabase
      .from('phase_outputs')
      .insert({
        phase_id: phaseId,
        output_type: phaseConfig.output_type,
        title: phaseConfig.output_title,
        content: outputContent,
        version: 1,
        status: 'draft',
        published_by: generatedBy
      })
      .select()
      .single()

    if (outErr) {
      return NextResponse.json({ error: outErr.message }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        actor_name: generatedBy || 'Maestro',
        actor_role: 'maestro',
        action: 'output_generated',
        description: `${phaseConfig.output_title} draft generated`,
        metadata: { output_id: output.id }
      })

    const ph = getPostHogClient()
    ph.capture({
      distinctId: generatedBy || 'system',
      event: 'ai_output_generated',
      properties: {
        phase_id: phaseId,
        phase_number: phase.phase_number,
        engagement_id: engagement.id,
        client_id: engagement.client_id,
        solution: engagement.solution,
        output_type: phaseConfig.output_type,
        output_id: output.id,
      },
    })
    await ph.shutdown()

    return NextResponse.json({ output, rawContent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
