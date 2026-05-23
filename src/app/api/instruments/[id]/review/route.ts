import { NextRequest } from 'next/server';
import { addInstrumentReview } from '@/lib/instruments/authoring';
import type { InstrumentReviewInput } from '@/lib/instruments/types';
import { canReviewInstruments, errorResponse, fail, mutationCtx, ok, requireInstrumentCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  if (!canReviewInstruments(ctx)) return fail('forbidden', 'Reviewer role required.', 403);
  const body = (await request.json().catch(() => null)) as InstrumentReviewInput | null;
  if (!body) return fail('bad_request', 'Expected review payload.', 400);
  const { id } = await params;
  try {
    const template = await addInstrumentReview(id, body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
