import { NextRequest } from 'next/server';
import { proposeSiblingMoves } from '@/lib/dependencies';
import { errorResponse, fail, ok, requireDependenciesCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireDependenciesCtx();
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const parentMoveTemplateId = url.searchParams.get('parentMoveTemplateId');
  if (!parentMoveTemplateId) {
    return fail('bad_request', 'Expected parentMoveTemplateId query parameter.', 400);
  }

  try {
    const proposal = await proposeSiblingMoves(parentMoveTemplateId);
    return ok({ proposal });
  } catch (error) {
    return errorResponse(error);
  }
}
