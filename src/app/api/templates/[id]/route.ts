import { NextRequest } from 'next/server';
import { getTemplate, updateTemplate } from '@/lib/templates/registry';
import type { MoveTemplateInput } from '@/lib/templates/types';
import { errorResponse, fail, mutationCtx, ok, requireTemplatesCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  try {
    const { id } = await params;
    const template = await getTemplate(decodeURIComponent(id));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as Partial<MoveTemplateInput> | null;
  if (!body) return fail('bad_request', 'Expected JSON template payload.', 400);
  try {
    const { id } = await params;
    const template = await updateTemplate(decodeURIComponent(id), body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
