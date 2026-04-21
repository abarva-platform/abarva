import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { runAtlasTurn } from '@/lib/atlas/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      threadId?: string | null;
      signalId?: string | null;
    };

    const message = body.message?.trim();
    if (!message) {
      return Response.json({ error: 'bad_request', detail: 'message required' }, { status: 400 });
    }

    const result = await runAtlasTurn({
      ctx,
      message,
      threadId: body.threadId,
      signalId: body.signalId,
    });

    return Response.json(result);
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
    }
  }
}
