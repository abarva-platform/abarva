import { NextRequest } from 'next/server';
import { submitForReview } from '@/lib/corpus/authoring';
import { errorResponse, mutationCtx, ok, requireCorpusCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  try {
    const pattern = await submitForReview(id, mutationCtx(ctx));
    return ok({ pattern });
  } catch (error) {
    return errorResponse(error);
  }
}
