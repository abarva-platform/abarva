import { NextRequest } from 'next/server';
import { addWorkshopReview } from '@/lib/workshops/authoring';
import type { WorkshopReviewInput } from '@/lib/workshops/types';
import { canReviewWorkshops, errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewWorkshops(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const body = (await request.json().catch(() => null)) as WorkshopReviewInput | null;
  if (!body) return fail('bad_request', 'Expected review payload.', 400);
  const { id } = await params;
  try {
    const template = await addWorkshopReview(id, body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
