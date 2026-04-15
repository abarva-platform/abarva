import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params
  const body = await req.json()
  const {
    file_url,
    numbers,
    skip,
    responded_by,
  } = body as {
    file_url?: string
    numbers?: Record<string, unknown>
    skip?: boolean
    responded_by?: string
  }

  // Determine new status
  let status: 'uploaded' | 'numbers_entered' | 'skipped'
  if (skip) {
    status = 'skipped'
  } else if (numbers && Object.keys(numbers).length > 0) {
    status = 'numbers_entered'
  } else if (file_url) {
    status = 'uploaded'
  } else {
    return NextResponse.json(
      { error: 'Provide file_url, numbers, or skip=true' },
      { status: 400 }
    )
  }

  const respondedAt = new Date().toISOString()

  // Fetch the data request first (needed for engagement context and file_requested label)
  const { data: dataRequest, error: fetchErr } = await supabase
    .from('data_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!dataRequest) {
    return NextResponse.json({ error: 'Data request not found' }, { status: 404 })
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    status,
    responded_at: respondedAt,
    responded_by: responded_by ?? null,
  }
  if (file_url) updatePayload.response_file_url = file_url
  if (numbers) updatePayload.response_numbers = numbers

  const { data: updated, error: updateErr } = await supabase
    .from('data_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // If numbers were entered, post a structured message to the Phase 0 workstream
  if (status === 'numbers_entered' && numbers) {
    // Find Phase 0 workstream for this engagement
    const { data: workstream, error: wsErr } = await supabase
      .from('workstreams')
      .select('id')
      .eq('engagement_id', dataRequest.engagement_id)
      .ilike('name', '%phase 0%')
      .maybeSingle()

    if (!wsErr && workstream) {
      const numbersLines = Object.entries(numbers)
        .map(([k, v]) => `• ${k}: ${v}`)
        .join('\n')

      const content = [
        `**Numbers provided for: ${dataRequest.file_requested}**`,
        '',
        numbersLines,
        '',
        `_Provided by ${responded_by ?? 'client'} on ${respondedAt}_`,
      ].join('\n')

      await supabase.from('workstream_messages').insert({
        workstream_id: workstream.id,
        engagement_id: dataRequest.engagement_id,
        actor_role: 'client',
        content,
        created_at: respondedAt,
      })
    }
  }

  return NextResponse.json({ data_request: updated })
}
