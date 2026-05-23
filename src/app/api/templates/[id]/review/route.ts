import { NextRequest } from 'next/server';
import { addTemplateReview } from '@/lib/templates/registry';
import type { MoveTemplateReviewInput } from '@/lib/templates/types';
import { canReviewTemplates, errorResponse, fail, mutationCtx, ok, requireTemplatesCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewTemplates(ctx)) return fail('forbidden', 'Template reviewer role required.', 403);
  const body = (await request.json().catch(() => null)) as MoveTemplateReviewInput | null;
  if (!body) return fail('bad_request', 'Expected JSON review payload.', 400);
  try {
    const { id } = await params;
    const template = await addTemplateReview(decodeURIComponent(id), body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
