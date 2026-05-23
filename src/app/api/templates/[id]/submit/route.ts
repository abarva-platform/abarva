import { NextRequest } from 'next/server';
import { submitTemplate } from '@/lib/templates/registry';
import { errorResponse, mutationCtx, ok, requireTemplatesCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireTemplatesCtx();
  if (ctx instanceof Response) return ctx;
  try {
    const { id } = await params;
    const template = await submitTemplate(decodeURIComponent(id), mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
