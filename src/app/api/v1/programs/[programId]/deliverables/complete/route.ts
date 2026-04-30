// POST /api/v1/programs/:programId/deliverables/complete
// Body: { deliverableTypeKey, title, content?, moduleKey?, signOff?, rationale? }
// Persists an accepted artifact and optionally signs it off for gate evaluation.

import { NextRequest } from 'next/server';
import { completeDeliverable } from '@/lib/programs/mutations';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as {
      deliverableTypeKey?: string;
      title?: string;
      content?: string;
      moduleKey?: string;
      signOff?: boolean;
      rationale?: string;
    };

    if (!body?.deliverableTypeKey || !body?.title) {
      return Response.json(
        { error: 'bad_request', detail: 'deliverableTypeKey + title required' },
        { status: 400 },
      );
    }

    const result = await completeDeliverable(ctx, programId, {
      deliverableTypeKey: body.deliverableTypeKey,
      title: body.title,
      content: body.content,
      moduleKey: body.moduleKey,
      signOff: body.signOff !== false,
      structuredData: {
        completed_via: 'api',
        rationale: body.rationale ?? null,
      },
    });

    return Response.json({ ok: true, ...result });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/deliverables/complete]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
