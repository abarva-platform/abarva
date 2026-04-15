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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadedBy = formData.get('uploadedBy') as string
    const uploadedByRole = formData.get('uploadedByRole') as string
    const workstreamId = formData.get('workstreamId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }

    const supabase = getSupabase()

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

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const storagePath = `${engagement.client_id}/engagement-${Date.now()}-${file.name}`

    const { error: storageErr } = await supabase.storage
      .from('datasets')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })

    if (storageErr) {
      return NextResponse.json({ error: storageErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('datasets')
      .getPublicUrl(storagePath)

    // Record in engagement_uploads
    const { data: upload, error: uploadErr } = await supabase
      .from('engagement_uploads')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        workstream_id: workstreamId || null,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        uploaded_by: uploadedBy || 'Unknown',
        uploaded_by_role: uploadedByRole || 'maestro',
        analysis_status: 'pending'
      })
      .select()
      .single()

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('engagement_activity')
      .insert({
        engagement_id: engagement.id,
        phase_id: phaseId,
        actor_name: uploadedBy || 'Unknown',
        actor_role: uploadedByRole || 'maestro',
        action: 'file_uploaded',
        description: `File uploaded: ${file.name}`,
        metadata: { upload_id: upload.id, workstream_id: workstreamId }
      })

    return NextResponse.json({
      upload,
      fileUrl: publicUrl,
      fileName: file.name
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
