import { NextRequest } from 'next/server';
import { retireWorkshopTemplate } from '@/lib/workshops/authoring';
import { canReviewWorkshops, errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewWorkshops(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const { id } = await params;
  try {
    const template = await retireWorkshopTemplate(id, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
