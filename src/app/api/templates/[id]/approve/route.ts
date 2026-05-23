import { NextRequest } from 'next/server';
import { approveTemplate } from '@/lib/templates/registry';
import { canReviewTemplates, errorResponse, fail, mutationCtx, ok, requireTemplatesCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewTemplates(ctx)) return fail('forbidden', 'Template reviewer role required.', 403);
  try {
    const { id } = await params;
    const template = await approveTemplate(decodeURIComponent(id), mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
