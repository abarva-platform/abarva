import { NextRequest } from 'next/server';
import { getPattern, updatePattern } from '@/lib/corpus/authoring';
import type { CorpusPatternInput } from '@/lib/corpus/types';
import { errorResponse, fail, mutationCtx, ok, requireCorpusCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  try {
    const pattern = await getPattern(id);
    return ok({ pattern });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as Partial<CorpusPatternInput> | null;
  if (!body) return fail('bad_request', 'Expected JSON corpus pattern patch.', 400);
  const { id } = await params;
  try {
    const pattern = await updatePattern(id, body, mutationCtx(ctx));
    return ok({ pattern });
  } catch (error) {
    return errorResponse(error);
  }
}
