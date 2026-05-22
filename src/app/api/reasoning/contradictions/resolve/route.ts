// POST /api/reasoning/contradictions/resolve
// Body: { contradictionId: string }
// Marks the supplied contradiction id as resolved in the local in-memory
// ring buffer. Persistence is out of scope for this iteration.

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { markResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { guardReasoning } from '@/app/api/reasoning/_auth';

export async function POST(request: Request) {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'body must be an object' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { contradictionId } = body as { contradictionId?: unknown };

  if (typeof contradictionId !== 'string' || contradictionId.length === 0) {
    return new Response(
      JSON.stringify({ error: 'contradictionId is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  markResolved(contradictionId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
