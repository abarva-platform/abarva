// POST /api/reasoning/gate-waiver
// Body: { type: 'gate_waiver'; criterionId: string; instanceId: string; reason: string }
// Demo-only endpoint — records a gate-criterion waiver in an in-memory store.
// No persistence: resets on server restart (matches missions/state and
// contradiction-resolution patterns).

interface GateWaiverBody {
  type: 'gate_waiver';
  criterionId: string;
  instanceId: string;
  reason: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// In-memory store — keyed by `${instanceId}::${criterionId}`.
const waiverStore = new Map<string, { reason: string; waivedAt: string }>();

/** Retrieve all waiver records whose key starts with `${instanceId}::`. */
export function getWaiversForInstance(
  instanceId: string,
): Array<{ criterionId: string; reason: string; waivedAt: string }> {
  const prefix = `${instanceId}::`;
  const results: Array<{ criterionId: string; reason: string; waivedAt: string }> = [];
  for (const [key, value] of waiverStore.entries()) {
    if (key.startsWith(prefix)) {
      results.push({ criterionId: key.slice(prefix.length), reason: value.reason, waivedAt: value.waivedAt });
    }
  }
  return results;
}

/** Clear all gate waivers — used by the demo-reset endpoint. */
export function clearWaivers(): void {
  waiverStore.clear();
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

  const { type, criterionId, instanceId, reason } = body as Partial<GateWaiverBody>;

  if (type !== 'gate_waiver') {
    return jsonResponse({ error: "type must be 'gate_waiver'" }, 400);
  }

  if (typeof criterionId !== 'string' || criterionId.length === 0) {
    return jsonResponse({ error: 'criterionId is required' }, 400);
  }

  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    return jsonResponse({ error: 'instanceId is required' }, 400);
  }

  if (typeof reason !== 'string' || reason.length === 0) {
    return jsonResponse({ error: 'reason is required' }, 400);
  }

  const key = `${instanceId}::${criterionId}`;
  waiverStore.set(key, { reason, waivedAt: new Date().toISOString() });

  return jsonResponse({ ok: true, key }, 200);
}
