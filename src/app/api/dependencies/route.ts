import { NextRequest } from 'next/server';
import { addDependency, getMoveDAG } from '@/lib/dependencies';
import type { DependencyRelationType, DependencyStatus } from '@/lib/dependencies';
import { errorResponse, fail, ok, requireDependenciesCtx } from './_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function splitParam(value: string | null): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function GET(request: NextRequest) {
  const ctx = await requireDependenciesCtx();
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  try {
    const dag = await getMoveDAG(ctx.clientId, {
      statuses: splitParam(url.searchParams.get('status')) as DependencyStatus[],
      sponsors: splitParam(url.searchParams.get('sponsor')),
      minDollarImpactUsd: url.searchParams.has('minDollarImpactUsd')
        ? Number(url.searchParams.get('minDollarImpactUsd'))
        : undefined,
    });
    return ok({ dag });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireDependenciesCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as {
    fromNodeId?: string;
    toNodeId?: string;
    relationType?: DependencyRelationType;
    note?: string | null;
    estimatedImpactUsd?: number | null;
    metadata?: Record<string, unknown>;
  } | null;

  if (!body?.fromNodeId || !body.toNodeId || !body.relationType) {
    return fail('bad_request', 'Expected fromNodeId, toNodeId, and relationType.', 400);
  }

  try {
    const dependency = await addDependency({
      clientId: ctx.clientId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      relationType: body.relationType,
      note: body.note,
      estimatedImpactUsd: body.estimatedImpactUsd,
      metadata: body.metadata,
      actorId: ctx.userId,
    });
    return ok({ dependency }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
