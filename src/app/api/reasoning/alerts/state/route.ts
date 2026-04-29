// POST /api/reasoning/alerts/state
// Body: { alertId: string, status: 'acknowledged' | 'dismissed', note?: string }
// Records the supplied alert status in the local in-memory alert
// acknowledgment store. Persistence is gated on the env-var-driven Postgres
// backend (see `alert-acknowledgment-init.ts`); the default behavior is
// in-memory only — restarts wipe the store, mirroring the
// contradiction-resolution and mission-state paths.

import {
  setAlertState,
  type AlertStatus,
} from '@/lib/reasoning/alert-acknowledgment-state';
import '@/lib/reasoning/alert-acknowledgment-init';

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

  const { alertId, status, note } = body as {
    alertId?: unknown;
    status?: unknown;
    note?: unknown;
  };

  if (typeof alertId !== 'string' || alertId.length === 0) {
    return jsonResponse({ error: 'alertId is required' }, 400);
  }

  if (status !== 'acknowledged' && status !== 'dismissed') {
    return jsonResponse(
      { error: "status must be 'acknowledged' or 'dismissed'" },
      400,
    );
  }

  if (note !== undefined && typeof note !== 'string') {
    return jsonResponse({ error: 'note must be a string when provided' }, 400);
  }

  setAlertState(alertId, status as AlertStatus, note as string | undefined);

  return jsonResponse({ ok: true }, 200);
}
