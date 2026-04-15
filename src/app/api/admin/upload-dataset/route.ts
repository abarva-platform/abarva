import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  let file: File | null = null
  let clientId = ''
  let documentName = ''

  try {
    const formData = await request.formData()
    file = formData.get('file') as File | null
    clientId = (formData.get('clientId') as string) || ''
    documentName = (formData.get('documentName') as string) || ''
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  if (!documentName) return NextResponse.json({ error: 'Missing documentName' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]
  let storageUrl: string | null = null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const BUCKET = 'datasets'

      // Create bucket if it doesn't exist
      await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {})

      const bytes = await file.arrayBuffer()
      const path = `${clientId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: false })

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        storageUrl = urlData.publicUrl
      }
    } catch {
      // Storage unavailable — proceed without URL
    }
  }

  return NextResponse.json({
    success: true,
    documentName,
    fileName: file.name,
    clientId,
    confidence: 85,
    uploader: 'Anand Sundaram · Admin',
    date: today,
    storageUrl,
  })
}
