import { NextRequest } from 'next/server';
import { instantiateTemplate } from '@/lib/templates/registry';
import type { InstantiateTemplateOptions } from '@/lib/templates/types';
import { errorResponse, mutationCtx, ok, requireTemplatesCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => ({}))) as {
    version?: number;
    options?: InstantiateTemplateOptions;
  };
  try {
    const { id } = await params;
    const instance = await instantiateTemplate(
      decodeURIComponent(id),
      body.version,
      ctx.clientId,
      body.options ?? {},
      mutationCtx(ctx),
    );
    return ok({ instance }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
