import { NextRequest, NextResponse } from 'next/server'

const DEMO_PAIRS = [
  { clientId: 'arcturus', solution: 'delivery' },
  { clientId: 'arcturus', solution: 'margin' },
  { clientId: 'arcturus', solution: 'tech' },
  { clientId: 'arcturus', solution: 'pdlc' },
  { clientId: 'arcturus', solution: 'ai-strategy' },
  { clientId: 'meridian', solution: 'tech' },
  { clientId: 'meridian', solution: 'margin' },
  { clientId: 'meridian', solution: 'pdlc' },
]

export async function POST(request: NextRequest) {
  try {
    const { createdBy } = await request.json().catch(() => ({}))
    const baseUrl = request.nextUrl.origin
    const results: { client: string; solution: string; status: string; message?: string }[] = []

    for (const { clientId, solution } of DEMO_PAIRS) {
      try {
        const res = await fetch(`${baseUrl}/api/engage/${clientId}/${solution}/seed-demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ createdBy: createdBy || 'admin-seed-all', fullDemo: true }),
        })
        const data = await res.json()
        results.push({
          client: clientId, solution,
          status: res.ok ? 'seeded' : 'error',
          message: data.message || data.error,
        })
      } catch (err: any) {
        results.push({ client: clientId, solution, status: 'error', message: err.message })
      }
    }

    const seeded = results.filter(r => r.status === 'seeded').length
    const errors = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      summary: `${seeded} of ${DEMO_PAIRS.length} demos seeded${errors > 0 ? `, ${errors} errors` : ''}`,
      results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
