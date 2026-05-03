import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import {
  DEFAULT_STRATEGIC_MOVES_PREFERENCES,
  getStrategicMovesPreferences,
  setStrategicMovesPreferences,
  type StrategicMovesListView,
  type StrategicMovesSort,
} from '@/lib/programs/strategic-moves-preferences';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseListView(value: unknown): StrategicMovesListView | null {
  if (value === 'scatter' || value === 'cards' || value === 'kanban') return value;
  return null;
}

function parseSort(value: unknown): StrategicMovesSort | null {
  if (value === 'value' || value === 'phase' || value === 'status' || value === 'name') return value;
  return null;
}

export async function GET() {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const strategicMoves = await getStrategicMovesPreferences(ctx);
  return Response.json({ strategicMoves });
}

export async function PUT(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  let body: { strategicMoves?: { listView?: unknown; sort?: unknown } };
  try {
    body = (await req.json()) as { strategicMoves?: { listView?: unknown; sort?: unknown } };
  } catch {
    return Response.json({ error: 'bad_request', detail: 'Malformed JSON' }, { status: 400 });
  }

  const listView = parseListView(body.strategicMoves?.listView) ?? DEFAULT_STRATEGIC_MOVES_PREFERENCES.listView;
  const sort = parseSort(body.strategicMoves?.sort) ?? DEFAULT_STRATEGIC_MOVES_PREFERENCES.sort;

  await setStrategicMovesPreferences(ctx, { listView, sort });
  return Response.json({ ok: true, strategicMoves: { listView, sort } });
}

