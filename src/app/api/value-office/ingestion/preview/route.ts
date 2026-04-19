import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildOperationalIngestionRegistry, runIngestionPreview } from '@/lib/value-office/ingestion'
import { listAbarNexusIngestionRuns, persistAbarNexusIngestionRun } from '@/lib/value-office/server'

export async function GET() {
  try {
    await auth().catch(() => null)
    const result = await listAbarNexusIngestionRuns()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to load ingestion runs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await auth().catch(() => null)
    const body = await request.json()
    const sourceId = typeof body?.sourceId === 'string' ? body.sourceId : ''

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 })
    }

    const source = buildOperationalIngestionRegistry('healthcare').find(entry => entry.sourceId === sourceId)
    const records = runIngestionPreview(sourceId)
    const persisted = await persistAbarNexusIngestionRun({
      sourceId,
      sourceName: source?.sourceName || sourceId,
      mode: 'preview',
      status: 'completed',
      recordCount: records.length,
      records,
      createdBy: authResult?.userId || null,
    }).catch(() => ({ schemaReady: false }))

    return NextResponse.json({
      sourceId,
      records,
      count: records.length,
      mode: 'preview',
      schemaReady: persisted.schemaReady !== false,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to run ingestion preview' }, { status: 500 })
  }
}
