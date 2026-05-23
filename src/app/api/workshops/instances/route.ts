import { NextRequest } from 'next/server';
import { createWorkshopInstance, listWorkshopInstances } from '@/lib/workshops/authoring';
import type { WorkshopInstanceInput } from '@/lib/workshops/types';
import { errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  try {
    const instances = await listWorkshopInstances({
      clientId: ctx.clientId,
      moveInstanceId: url.searchParams.get('moveInstanceId') ?? undefined,
      gateId: url.searchParams.get('gateId') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return ok({ instances });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as WorkshopInstanceInput | null;
  if (!body) return fail('bad_request', 'Expected JSON workshop instance payload.', 400);

  try {
    const instance = await createWorkshopInstance(body, mutationCtx(ctx));
    return ok({ instance }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
