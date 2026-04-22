import { NextRequest, NextResponse } from 'next/server';
import { seedDemoData, removeDemoData } from '@/scripts/demo-data/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    industry?: 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';
    orgSize?: 'small' | 'mid' | 'enterprise';
    aiMaturity?: 'early' | 'scaling' | 'mature';
  };

  if (!body.clientId || !body.industry || !body.orgSize || !body.aiMaturity) {
    return NextResponse.json({ error: 'clientId, industry, orgSize, aiMaturity all required' }, { status: 400 });
  }

  try {
    const summary = await seedDemoData({
      clientId: body.clientId,
      industry: body.industry,
      orgSize: body.orgSize,
      aiMaturity: body.aiMaturity,
    });
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  try {
    const result = await removeDemoData(clientId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown' }, { status: 500 });
  }
}
