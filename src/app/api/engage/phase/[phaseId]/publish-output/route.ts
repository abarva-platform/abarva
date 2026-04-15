import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { outputId, publishedBy, publisherRole } = await request.json()

    if (!outputId) {
      return NextResponse.json({ error: 'outputId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get phase context
    const { data: phase, error: phaseErr } = await supabase
      .from('engagement_phases')
      .select('*, engagements(*)')
      .eq('id', phaseId)
      .single()

    if (phaseErr || !phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    const engagement = phase.engagements as any
    const now = new Date().toISOString()

    // Supersede any existing published outputs for this phase
    await supabase
      .from('phase_outputs')
      .update({ status: 'superseded' })
      .eq('phase_id', phaseId)
      .eq('status', 'published')

    // Publish the selected output
    const { data: output, error: outErr } = await supabase
      .from('phase_outputs')
      .update({
        status: 'published',
        published_at: now,
        published_by: publishedBy
      })
      .eq('id', outputId)
      .select()
      .single()

    if (outErr) {
      return NextResponse.json({ error: outErr.message }, { status: 500 })
    }

    // Save version snapshot
    await supabase
      .from('output_versions')
      .insert({
        output_id: outputId,
        version: output.version,
        content: output.content,
        published_by: publishedBy,
        published_at: now,
        change_summary: 'Published to client'
      })

    // Update phase status to published_to_client
    await supabase
      .from('engagement_phases')
      .update({
        status: 'published_to_client'
      })
      .eq('id', phaseId)

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        actor_name: publishedBy || 'Maestro',
        actor_role: publisherRole || 'maestro',
        action: 'output_published',
        description: `${output.title} published to client`,
        metadata: { output_id: outputId }
      })

    return NextResponse.json({ output, phaseStatus: 'published_to_client' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
