import { NextRequest } from 'next/server';
import { acceptSiblingRecommendations } from '@/lib/dependencies';
import type { SiblingDecision } from '@/lib/dependencies';
import { errorResponse, fail, ok, requireDependenciesCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ctx = await requireDependenciesCtx();
  if (ctx instanceof Response) return ctx;

  const body = (await request.json().catch(() => null)) as {
    parentMoveInstanceId?: string;
    decisions?: SiblingDecision[];
    acceptAll?: boolean;
    includeSourceWorkflows?: boolean;
  } | null;

  if (!body?.parentMoveInstanceId) {
    return fail('bad_request', 'Expected parentMoveInstanceId.', 400);
  }

  try {
    const result = await acceptSiblingRecommendations({
      clientId: ctx.clientId,
      parentMoveInstanceId: body.parentMoveInstanceId,
      decisions: body.decisions,
      acceptAll: body.acceptAll,
      includeSourceWorkflows: body.includeSourceWorkflows,
      actorId: ctx.userId,
    });
    return ok({ result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
