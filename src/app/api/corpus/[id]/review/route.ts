import { NextRequest } from 'next/server';
import { addReview } from '@/lib/corpus/authoring';
import type { CorpusReviewInput } from '@/lib/corpus/types';
import { canReviewCorpus, errorResponse, fail, mutationCtx, ok, requireCorpusCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewCorpus(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const body = (await request.json().catch(() => null)) as CorpusReviewInput | null;
  if (!body) return fail('bad_request', 'Expected review payload.', 400);
  const { id } = await params;
  try {
    const pattern = await addReview(id, body, mutationCtx(ctx));
    return ok({ pattern });
  } catch (error) {
    return errorResponse(error);
  }
}
