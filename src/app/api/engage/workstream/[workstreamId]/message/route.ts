import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, PromptContext } from '@/lib/prompts/engagement-prompts'
import { SolutionKey, PhaseKey } from '@/lib/solutions/solution-config'
import { getClientDataset } from '@/lib/knowledge/client-datasets'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workstreamId: string }> }
) {
  try {
    const { workstreamId } = await params
    console.log('[message] POST start — workstreamId:', workstreamId)
    const { content, actorName, actorId, isInternal } = await request.json()
    console.log('[message] body parsed — content length:', content?.length)

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get workstream with phase and engagement context
    const { data: workstream, error: wsErr } = await supabase
      .from('phase_workstreams')
      .select('*, engagement_phases(*, engagements(*))')
      .eq('id', workstreamId)
      .single()

    if (wsErr || !workstream) {
      console.error('[message] workstream fetch error:', wsErr)
      return NextResponse.json({ error: 'Workstream not found' }, { status: 404 })
    }
    console.log('[message] workstream loaded — phase_number:', (workstream.engagement_phases as any)?.phase_number)

    const phase = workstream.engagement_phases as any
    const engagement = phase.engagements as any

    // Save the human message
    const { data: userMsg } = await supabase
      .from('workstream_messages')
      .insert({
        workstream_id: workstreamId,
        role: 'maestro',
        actor_name: actorName || 'Maestro',
        actor_id: actorId,
        content,
        is_internal: isInternal || false
      })
      .select()
      .single()

    // Get conversation history (all messages in this workstream)
    const { data: history } = await supabase
      .from('workstream_messages')
      .select('*')
      .eq('workstream_id', workstreamId)
      .order('created_at')

    // Get Phase 0 output for context
    let phase0Output = null
    const { data: phase0 } = await supabase
      .from('engagement_phases')
      .select('id')
      .eq('engagement_id', engagement.id)
      .eq('phase_number', 0)
      .single()

    if (phase0) {
      const { data: p0output } = await supabase
        .from('phase_outputs')
        .select('content')
        .eq('phase_id', phase0.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (p0output) phase0Output = p0output.content
    }

    // Get genome matches
    const { data: genomeMatches } = await supabase
      .from('genome_matches')
      .select('*')
      .eq('engagement_id', engagement.id)

    // Load client dataset knowledge (gives Maestro AI specific knowledge of
    // the client's technology landscape, ETL stack, systems, financials, etc.)
    const clientDataset = getClientDataset(engagement.client_id, engagement.solution)

    // Build context for AI
    const ctx: PromptContext = {
      clientName: engagement.metadata?.client_name || engagement.client_id,
      clientId: engagement.client_id,
      solution: engagement.solution as SolutionKey,
      phase: phase.phase_number as PhaseKey,
      workstreamName: workstream.name,
      phase0Output,
      genomeMatches: genomeMatches || [],
      datasetSummaries: clientDataset || undefined,
      conversationHistory: history || []
    }

    const systemPrompt = buildSystemPrompt(ctx)

    // Build messages for Claude (skip system messages, convert roles)
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = (history || [])
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: (m.role === 'maestro_ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content as string
      }))

    console.log('[message] context built — calling Anthropic')
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages.length > 0 ? claudeMessages : [
        { role: 'user', content: content }
      ]
    })

    const fullResponse = claudeResponse.content[0]?.type === 'text'
      ? claudeResponse.content[0].text
      : ''

    // Save AI response to DB
    await supabase
      .from('workstream_messages')
      .insert({
        workstream_id: workstreamId,
        role: 'maestro_ai',
        actor_name: 'AbarVa AI',
        content: fullResponse,
        is_internal: false,
        metadata: {
          output_ready: fullResponse.includes('OUTPUT_READY')
        }
      })

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phase.id,
        actor_name: actorName || 'Maestro',
        actor_role: 'maestro',
        action: 'message_sent',
        description: `Message in ${workstream.name} workstream`,
        metadata: { workstream_id: workstreamId }
      })

    return new Response(fullResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-User-Message-Id': userMsg?.id || ''
      }
    })
  } catch (err: any) {
    console.error('[message] CAUGHT ERROR:', err)
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workstreamId: string }> }
) {
  try {
    const { workstreamId } = await params
    const supabase = getSupabase()

    const { data: messages, error } = await supabase
      .from('workstream_messages')
      .select('*')
      .eq('workstream_id', workstreamId)
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
