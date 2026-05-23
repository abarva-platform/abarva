import { NextRequest } from 'next/server';
import { approveInstrumentTemplate } from '@/lib/instruments/authoring';
import { canReviewInstruments, errorResponse, fail, mutationCtx, ok, requireInstrumentCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewInstruments(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const { id } = await params;
  try {
    const template = await approveInstrumentTemplate(id, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
