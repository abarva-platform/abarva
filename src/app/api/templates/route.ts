import { NextRequest } from 'next/server';
import { createTemplate, listTemplates } from '@/lib/templates/registry';
import type { MoveTemplateInput, MoveTemplateKind, MoveTemplateStatus } from '@/lib/templates/types';
import { errorResponse, fail, mutationCtx, ok, requireTemplatesCtx } from './_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  try {
    const templates = await listTemplates({
      kind: (url.searchParams.get('kind') || undefined) as MoveTemplateKind | undefined,
      status: (url.searchParams.get('status') || undefined) as MoveTemplateStatus | undefined,
      limit: Number(url.searchParams.get('limit') ?? 100),
    });
    return ok({ templates });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as MoveTemplateInput | null;
  if (!body) return fail('bad_request', 'Expected JSON template payload.', 400);

  try {
    const template = await createTemplate(body, mutationCtx(ctx));
    return ok({ template }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
