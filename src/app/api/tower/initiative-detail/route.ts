import { NextResponse } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { listInitiativesForClient } from '@/lib/admin/ai-initiatives/queries';
import { getInitiativeDetail } from '@/lib/admin/ai-initiatives/detail-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawDisplayId = url.searchParams.get('displayId') ?? url.searchParams.get('initiativeId');
  const lookup = rawDisplayId?.trim().toLowerCase();

  if (!lookup) {
    return NextResponse.json({ ok: false, error: 'displayId is required' }, { status: 400 });
  }

  const client = await getActiveClientRow();
  if (!client) {
    return NextResponse.json({ ok: false, error: 'No active client resolved' }, { status: 404 });
  }

  const initiatives = await listInitiativesForClient(client.id);
  const initiative = initiatives.find((row) => (
    row.displayId.toLowerCase() === lookup ||
    row.initiativeId.toLowerCase() === lookup
  ));

  if (!initiative) {
    return NextResponse.json({ ok: false, error: 'Initiative not found for active client' }, { status: 404 });
  }

  const detail = await getInitiativeDetail(client.id, initiative.initiativeId).catch((error) => {
    console.warn('[tower initiative detail] supporting substrate unavailable', {
      clientId: client.id,
      displayId: initiative.displayId,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return null;
  });
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'Initiative detail unavailable' });
  }

  return NextResponse.json({
    ok: true,
    client: { id: client.id, name: client.name, key: client.key },
    detail,
  });
}
