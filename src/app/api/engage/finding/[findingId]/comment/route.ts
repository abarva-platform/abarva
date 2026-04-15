import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
) {
  try {
    const { findingId } = await params
    const { actorId, actorName, actorRole, content } = await request.json()

    if (!content || !actorName) {
      return NextResponse.json({ error: 'content and actorName required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: findingId,
        actor_id: actorId,
        actor_name: actorName,
        actor_role: actorRole || 'maestro',
        content
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
) {
  // Update finding status (confirm, dispute, remove, publish)
  try {
    const { findingId } = await params
    const { status, isPublished, updatedBy } = await request.json()
    const supabase = getSupabase()

    const updates: any = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (isPublished !== undefined) updates.is_published = isPublished

    const { data: finding, error } = await supabase
      .from('phase_findings')
      .update(updates)
      .eq('id', findingId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ finding })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
