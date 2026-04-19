import { NextRequest, NextResponse } from 'next/server';
import { ingestClientFile } from '@/lib/data/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const clientId = (form.get('clientId') as string | null)?.trim();
    const file = form.get('file') as File | null;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `file exceeds ${MAX_BYTES} bytes` }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await ingestClientFile({
      clientId,
      filename: file.name,
      bytes,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[data/upload] error:', err);
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
