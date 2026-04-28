// POST /api/reasoning/missions/state
// Body: { missionId: string, status: 'complete' | 'dismissed', note?: string }
// Records the supplied mission status in the local in-memory mission state
// store. Persistence is out of scope for this iteration — restarts wipe the
// store, mirroring the contradiction-resolution and evidence-ingestion paths.

import {
  setMissionState,
  type MissionStatus,
} from '@/lib/reasoning/mission-state-store';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { missionId, status, note } = body as {
    missionId?: unknown;
    status?: unknown;
    note?: unknown;
  };

  if (typeof missionId !== 'string' || missionId.length === 0) {
    return jsonResponse({ error: 'missionId is required' }, 400);
  }

  if (status !== 'complete' && status !== 'dismissed') {
    return jsonResponse(
      { error: "status must be 'complete' or 'dismissed'" },
      400,
    );
  }

  if (note !== undefined && typeof note !== 'string') {
    return jsonResponse({ error: 'note must be a string when provided' }, 400);
  }

  setMissionState(missionId, status as MissionStatus, note as string | undefined);

  return jsonResponse({ ok: true }, 200);
}
