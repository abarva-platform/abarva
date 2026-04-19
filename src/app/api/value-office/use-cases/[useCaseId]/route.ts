import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getValueOfficeUseCase,
  recordValueOfficeDecision,
  saveValueOfficeContracts,
  saveValueOfficeEvidenceSources,
  saveValueOfficeMetricSnapshots,
} from '@/lib/value-office/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ useCaseId: string }> }
) {
  try {
    await auth().catch(() => null)
    const { useCaseId } = await params
    const result = await getValueOfficeUseCase(useCaseId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ useCaseId: string }> }
) {
  try {
    const body = await request.json()
    const clerkAuth = await auth().catch(() => null)
    const updatedBy = clerkAuth?.userId || 'local-advisor'
    const { useCaseId } = await params

    const valueContracts = Array.isArray(body.valueContracts) ? body.valueContracts : null
    const evidenceSources = Array.isArray(body.evidenceSources) ? body.evidenceSources : null
    const metricSnapshots = Array.isArray(body.metricSnapshots) ? body.metricSnapshots : null
    const decision = body.decision ? String(body.decision) : null
    const rationale = body.rationale ? String(body.rationale) : ''
    if (!valueContracts && !evidenceSources && !metricSnapshots && !decision) {
      return NextResponse.json({ error: 'valueContracts, evidenceSources, metricSnapshots, or decision required' }, { status: 400 })
    }

    const result = valueContracts
      ? await saveValueOfficeContracts({
          useCaseId,
          updatedBy,
          valueContracts,
        })
      : evidenceSources
        ? await saveValueOfficeEvidenceSources({
            useCaseId,
            updatedBy,
            evidenceSources: evidenceSources!,
          })
        : metricSnapshots
          ? await saveValueOfficeMetricSnapshots({
              useCaseId,
              updatedBy,
              metricSnapshots,
            })
        : await recordValueOfficeDecision({
            useCaseId,
            updatedBy,
            decision: decision as Parameters<typeof recordValueOfficeDecision>[0]['decision'],
            rationale,
          })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
