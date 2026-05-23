import { NextRequest } from 'next/server';
import { publishPattern } from '@/lib/corpus/authoring';
import { canReviewCorpus, errorResponse, fail, mutationCtx, ok, requireCorpusCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewCorpus(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const { id } = await params;
  try {
    const pattern = await publishPattern(id, mutationCtx(ctx));
    return ok({ pattern });
  } catch (error) {
    return errorResponse(error);
  }
}
