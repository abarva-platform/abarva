import { NextResponse } from 'next/server';

import { runNorthstarContextIngestion } from '@/lib/context-ingestion/sync-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    fileName?: string;
    text?: string;
    mimeType?: string;
  } | null;
  if (!body?.fileName) {
    return NextResponse.json({ error: 'fileName required' }, { status: 400 });
  }
  const result = runNorthstarContextIngestion({
    fileName: body.fileName,
    mimeType: body.mimeType,
    text: body.text ?? '',
  });
  return NextResponse.json(result);
}
