import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listValueOfficeUseCases } from '@/lib/value-office/server'

export async function GET(request: NextRequest) {
  try {
    await auth().catch(() => null)
    const clientId = request.nextUrl.searchParams.get('clientId') || undefined
    const result = await listValueOfficeUseCases(clientId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
