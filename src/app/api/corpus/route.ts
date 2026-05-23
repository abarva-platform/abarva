import { NextRequest } from 'next/server';
import { createPattern, listPatterns } from '@/lib/corpus/authoring';
import type { CorpusPatternInput } from '@/lib/corpus/types';
import { errorResponse, fail, mutationCtx, ok, requireCorpusCtx } from './_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  try {
    const patterns = await listPatterns({
      status: url.searchParams.get('status') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return ok({ patterns });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as CorpusPatternInput | null;
  if (!body) return fail('bad_request', 'Expected JSON corpus pattern payload.', 400);

  try {
    const pattern = await createPattern(body, mutationCtx(ctx));
    return ok({ pattern }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
