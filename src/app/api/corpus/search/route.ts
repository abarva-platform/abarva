import { NextRequest } from 'next/server';
import { searchCorpus } from '@/lib/corpus/retrieval';
import { errorResponse, ok, requireCorpusCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csv(value: string | null): string[] | undefined {
  const items = value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
  return items.length ? items : undefined;
}

export async function GET(request: NextRequest) {
  const ctx = await requireCorpusCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  try {
    const hits = await searchCorpus(query, {
      clientId: ctx.clientId,
      userId: ctx.userId,
      category: url.searchParams.get('category') ?? undefined,
      verticalOverlays: csv(url.searchParams.get('verticalOverlays')),
      regionOverlays: csv(url.searchParams.get('regionOverlays')),
      minConfidence: url.searchParams.has('minConfidence') ? Number(url.searchParams.get('minConfidence')) : undefined,
      minDepthScore: url.searchParams.has('minDepthScore') ? Number(url.searchParams.get('minDepthScore')) : undefined,
      includePrivate: url.searchParams.get('includePrivate') === 'true',
      versionPin: url.searchParams.has('versionPin') ? Number(url.searchParams.get('versionPin')) : undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
    });
    return ok({ hits });
  } catch (error) {
    return errorResponse(error);
  }
}
