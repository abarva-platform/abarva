import { NextRequest } from 'next/server';
import { getGenomePatternDetail } from '@/lib/graph/retrieval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const detail = await getGenomePatternDetail(code);
  if (!detail) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(detail), {
    headers: { 'Content-Type': 'application/json' },
  });
}
