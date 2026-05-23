import { NextRequest } from 'next/server';
import { removeDependency } from '@/lib/dependencies';
import { errorResponse, ok, requireDependenciesCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireDependenciesCtx();
  if (ctx instanceof Response) return ctx;

  try {
    const { id } = await params;
    const dependency = await removeDependency({
      clientId: ctx.clientId,
      dependencyId: decodeURIComponent(id),
      actorId: ctx.userId,
    });
    return ok({ dependency });
  } catch (error) {
    return errorResponse(error);
  }
}
