// POST /api/reasoning/contradictions/resolve
// Body: { contradictionId: string }
// Marks the supplied contradiction id as resolved in the local in-memory
// ring buffer. Persistence is out of scope for this iteration.

import { markResolved } from '@/lib/reasoning/contradiction-resolution-state';

export async function POST(request: Request) {
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
