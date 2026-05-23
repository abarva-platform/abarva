import { NextRequest } from 'next/server';
import { submitWorkshopTemplate } from '@/lib/workshops/authoring';
import { errorResponse, mutationCtx, ok, requireWorkshopCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  try {
    const template = await submitWorkshopTemplate(id, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
